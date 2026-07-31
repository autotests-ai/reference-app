const fs = require('fs');
const path = require('path');
const { attachment, attachmentPath } = require('allure-js-commons');
const { render: renderHarViewer } = require('./har-viewer');

function videoFolder() {
  const base = process.env.PW_VIDEO_FOLDER || 'https://selenoid.qa.guru/video/';
  return base.endsWith('/') ? base : `${base}/`;
}

function videoFileName() {
  return process.env.PW_VIDEO_NAME || '';
}

async function browserConsoleLogs(lines) {
  const text = (lines || []).join('\n') || '(no console messages)';
  await attachment('Browser console logs', text, 'text/plain');
}

async function pageSource(html) {
  await attachment('Page source', html || '', 'text/html');
}

async function lastScreenshot(png) {
  await attachment('Last screenshot', png, 'image/png');
}

async function video() {
  const name = videoFileName();
  if (!name) {
    return;
  }
  const videoUrl = `${videoFolder()}${name}`;
  const html =
    `<html><body><video width='100%' height='100%' controls autoplay><source src='${videoUrl}' type='video/mp4'></video></body></html>`;
  await attachment('Video', html, 'text/html');
}

async function harLogs(harPath) {
  if (!harPath || !fs.existsSync(harPath)) {
    return;
  }
  const bytes = fs.readFileSync(harPath);
  if (!bytes.length) {
    return;
  }
  // attachmentPath keeps the .har suffix (inline attachment() was coerced to .json).
  const dest = path.join(path.dirname(harPath), 'capture.har');
  fs.writeFileSync(dest, bytes);
  await attachmentPath('capture.har', dest, {
    contentType: 'application/json',
    fileExtension: '.har',
  });
  await attachment('HAR Viewer', renderHarViewer(bytes), 'text/html');
}

module.exports = {
  browserConsoleLogs,
  pageSource,
  lastScreenshot,
  video,
  harLogs,
  videoFileName,
  videoFolder,
};
