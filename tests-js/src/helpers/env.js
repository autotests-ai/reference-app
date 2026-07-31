function envBool(name, defaultValue = false) {
  const raw = process.env[name];
  if (raw === undefined || raw === '') {
    return defaultValue;
  }
  return ['1', 'true', 'yes', 'on'].includes(String(raw).trim().toLowerCase());
}

/** Maximum Allure attachments (video, HAR, screenshot, page source, console). */
function attachFull() {
  return envBool('ATTACH_FULL');
}

function attachBrowserConsoleLogs() {
  return attachFull() || envBool('ATTACH_BROWSER_CONSOLE_LOGS');
}

function attachHarLogs() {
  return attachFull() || envBool('ATTACH_HAR_LOGS') || envBool('ENABLE_HAR');
}

function attachLastScreenshot() {
  return attachFull() || envBool('ATTACH_LAST_SCREENSHOT');
}

function attachPageSource() {
  return attachFull() || envBool('ATTACH_PAGE_SOURCE');
}

function attachVideo() {
  return attachFull() || envBool('ATTACH_VIDEO') || envBool('PW_ENABLE_VIDEO');
}

module.exports = {
  envBool,
  attachFull,
  attachBrowserConsoleLogs,
  attachHarLogs,
  attachLastScreenshot,
  attachPageSource,
  attachVideo,
};
