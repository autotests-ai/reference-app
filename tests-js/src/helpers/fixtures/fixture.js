const { test: base } = require('@playwright/test');
const { App } = require('../../pages/app');
const {
  attachBrowserConsoleLogs,
  attachHarLogs,
  attachLastScreenshot,
  attachPageSource,
  attachVideo,
  attachFull,
} = require('../env');
const Attachments = require('../attachments');

const BASE_URL = process.env.UI_URL || 'https://reference-app.autotests.ai';

function wantAnyAttachments() {
  return (
    attachFull() ||
    attachBrowserConsoleLogs() ||
    attachHarLogs() ||
    attachLastScreenshot() ||
    attachPageSource() ||
    attachVideo()
  );
}

/**
 * Full-attachments: all artifacts land in Playwright afterEach (flat under
 * After Hooks → afterEach), same shape as Java TestBase.afterEach.
 */
const test = base.extend({
  context: async ({ browser }, use, testInfo) => {
    const har = attachHarLogs();
    const harPath = har ? testInfo.outputPath('capture.har') : null;
    const context = await browser.newContext({
      baseURL: BASE_URL,
      ...(har ? { recordHar: { path: harPath, mode: 'minimal' } } : {}),
    });
    testInfo._zdsHarPath = harPath;
    await use(context);
    if (!context._zdsClosedByAfterEach) {
      await context.close();
    }
  },

  webApp: async ({ page }, use) => {
    const app = new App(page);
    await use(app);
  },

  // Capture console / failed requests during the test (no attachments here).
  _consoleCapture: [
    async ({ page }, use, testInfo) => {
      const logs = [];
      testInfo._zdsConsoleLogs = logs;
      if (attachBrowserConsoleLogs()) {
        page.on('console', (msg) => {
          logs.push(`${msg.type()}: ${msg.text()}`);
        });
        page.on('pageerror', (err) => {
          logs.push(`pageerror: ${err.message}`);
        });
        page.on('requestfailed', (req) => {
          const failure = req.failure();
          logs.push(
            `requestfailed: ${req.url()} — ${failure ? failure.errorText : 'failed'}`,
          );
        });
        page.on('response', (resp) => {
          const status = resp.status();
          if (status >= 400) {
            logs.push(`response: ${status} ${resp.url()}`);
          }
        });
      }
      await use();
    },
    { auto: true },
  ],
});

test.afterEach(async ({ page, context }, testInfo) => {
  if (!wantAnyAttachments()) {
    return;
  }

  const logs = testInfo._zdsConsoleLogs || [];
  try {
    if (attachBrowserConsoleLogs()) {
      await Attachments.browserConsoleLogs(logs);
    }
    if (attachPageSource()) {
      await Attachments.pageSource(await page.content());
    }
    if (attachLastScreenshot()) {
      await Attachments.lastScreenshot(await page.screenshot({ fullPage: false }));
    }
    if (attachVideo()) {
      await Attachments.video();
    }
    if (attachHarLogs() && testInfo._zdsHarPath) {
      // Flush recordHar, then attach capture.har + HAR Viewer next to the rest.
      context._zdsClosedByAfterEach = true;
      await context.close();
      await Attachments.harLogs(testInfo._zdsHarPath);
    }
  } catch (err) {
    console.warn('full-attachments afterEach:', err.message || err);
  }
});

exports.test = test;
