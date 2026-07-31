const { test: base } = require('@playwright/test');
const { App } = require('../../pages/app');
const {
  attachBrowserConsoleLogs,
  attachHarLogs,
  attachLastScreenshot,
  attachPageSource,
  attachVideo,
} = require('../env');
const Attachments = require('../attachments');

const BASE_URL = process.env.UI_URL || 'https://reference-app.autotests.ai';

exports.test = base.extend({
  context: async ({ browser }, use, testInfo) => {
    const har = attachHarLogs();
    const harPath = har ? testInfo.outputPath('capture.har') : null;
    const context = await browser.newContext({
      baseURL: BASE_URL,
      ...(har ? { recordHar: { path: harPath, mode: 'minimal' } } : {}),
    });
    await use(context);
    await context.close();
    if (har && harPath) {
      await Attachments.harLogs(harPath);
    }
  },

  webApp: async ({ page }, use) => {
    const app = new App(page);
    await use(app);
  },

  _fullAttachments: [
    async ({ page }, use) => {
      const wantConsole = attachBrowserConsoleLogs();
      const wantSource = attachPageSource();
      const wantShot = attachLastScreenshot();
      const wantVid = attachVideo();
      if (!wantConsole && !wantSource && !wantShot && !wantVid) {
        await use();
        return;
      }
      const logs = [];
      if (wantConsole) {
        page.on('console', (msg) => {
          logs.push(`${msg.type()}: ${msg.text()}`);
        });
      }
      await use();
      try {
        if (wantConsole) {
          await Attachments.browserConsoleLogs(logs);
        }
        if (wantSource) {
          await Attachments.pageSource(await page.content());
        }
        if (wantShot) {
          await Attachments.lastScreenshot(await page.screenshot({ fullPage: false }));
        }
        if (wantVid) {
          await Attachments.video();
        }
      } catch (err) {
        // Never fail the test on attachment errors
        console.warn('full-attachments teardown:', err.message || err);
      }
    },
    { auto: true },
  ],
});
