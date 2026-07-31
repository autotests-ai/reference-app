/**
 * Page ops that avoid Allure Playwright steps ("Get content" / "Screenshot").
 */

async function pageSourceQuiet(page) {
  const client = await page.context().newCDPSession(page);
  try {
    const { result } = await client.send('Runtime.evaluate', {
      expression: 'document.documentElement.outerHTML',
      returnByValue: true,
    });
    return (result && result.value) || '';
  } finally {
    await client.detach().catch(() => {});
  }
}

async function screenshotQuiet(page) {
  const client = await page.context().newCDPSession(page);
  try {
    const { data } = await client.send('Page.captureScreenshot', {
      format: 'png',
      fromSurface: true,
    });
    return Buffer.from(data, 'base64');
  } finally {
    await client.detach().catch(() => {});
  }
}

module.exports = {
  pageSourceQuiet,
  screenshotQuiet,
};
