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
const { pageSourceQuiet, screenshotQuiet } = require('../quiet-page');
const { createHarCollector } = require('../har-collect');

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
 * Full-attachments: artifacts in afterEach only (no Playwright step noise).
 * HAR via CDP collector — not recordHar — so we never "Close context" here.
 */
const test = base.extend({
  context: async ({ browser }, use) => {
    const context = await browser.newContext({ baseURL: BASE_URL });
    await use(context);
    await context.close();
  },

  webApp: async ({ page }, use) => {
    const app = new App(page);
    await use(app);
  },

  _artifactCapture: [
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
      let har = null;
      if (attachHarLogs()) {
        har = createHarCollector();
        testInfo._zdsHar = har;
        await har.start(page);
      }
      await use();
      if (har) {
        await har.stop();
      }
    },
    { auto: true },
  ],
});

test.afterEach(async ({ page }, testInfo) => {
  if (!wantAnyAttachments()) {
    return;
  }

  const logs = testInfo._zdsConsoleLogs || [];
  try {
    if (attachBrowserConsoleLogs()) {
      await Attachments.browserConsoleLogs(logs);
    }
    if (attachPageSource()) {
      await Attachments.pageSource(await pageSourceQuiet(page));
    }
    if (attachLastScreenshot()) {
      await Attachments.lastScreenshot(await screenshotQuiet(page));
    }
    if (attachVideo()) {
      await Attachments.video();
    }
    if (attachHarLogs() && testInfo._zdsHar) {
      const bytes = testInfo._zdsHar.toHarBytes();
      const harPath = testInfo.outputPath('capture.har');
      require('fs').writeFileSync(harPath, bytes);
      await Attachments.harLogs(harPath);
    }
  } catch (err) {
    console.warn('full-attachments afterEach:', err.message || err);
  }
});

exports.test = test;
