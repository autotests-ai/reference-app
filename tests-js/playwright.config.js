// @ts-check
const { defineConfig, devices } = require('@playwright/test');
const dotenv = require('dotenv');
const path = require('path');

if (!process.env.CI) {
  dotenv.config({ path: path.resolve(__dirname, '.env') });
}

/**
 * When PW_WS_ENDPOINT is set, connect to Selenoid Playwright proxy.
 * Otherwise launch local Chromium (RealWorldTests-style local runs).
 */
function remoteConnectOptions() {
  const ws =
    process.env.PW_WS_ENDPOINT ||
    process.env.PLAYWRIGHT_WS_ENDPOINT ||
    process.env.PW_TEST_CONNECT_WS_ENDPOINT;
  if (!ws) {
    return undefined;
  }
  const options = {
    name: process.env.PW_SESSION_NAME || 'reference-app-js',
    sessionTimeout: process.env.PW_SESSION_TIMEOUT || '5m',
    enableVNC: process.env.PW_ENABLE_VNC || 'false',
    enableVideo: process.env.PW_ENABLE_VIDEO || 'false',
  };
  const endpoint = ws.includes('?')
    ? ws
    : `${ws}?${new URLSearchParams(options)}`;
  return { wsEndpoint: endpoint };
}

const connectOptions = remoteConnectOptions();

module.exports = defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['line'], ['allure-playwright']],
  use: {
    baseURL: process.env.UI_URL || 'https://reference-app.autotests.ai',
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
    ...(connectOptions ? { connectOptions } : {}),
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
