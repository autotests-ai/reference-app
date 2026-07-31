const fs = require('fs');
const path = require('path');

const TEMPLATE = fs.readFileSync(
  path.resolve(__dirname, '../../resources/har-viewer-template.html'),
  'utf8',
);

function escapeHtml(text) {
  if (text == null || text === '') {
    return '';
  }
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function stringVal(value) {
  return value == null ? '' : String(value);
}

function numVal(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function formatBytes(bytes) {
  if (bytes <= 0) {
    return '—';
  }
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function statusColor(status) {
  if (status >= 500) return 'color:#f48771';
  if (status >= 400) return 'color:#cca700';
  if (status >= 300) return 'color:#6cb6ff';
  if (status > 0) return 'color:#89d185';
  return 'color:#999';
}

function statusClass(status) {
  if (status >= 500) return 'har-status--err';
  if (status >= 400) return 'har-status--warn';
  if (status >= 300) return 'har-status--redir';
  if (status > 0) return 'har-status--ok';
  return 'har-status--muted';
}

function responseSize(entry) {
  const size = numVal(entry?.response?.content?.size, 0);
  return Math.max(size, 0);
}

function buildHeaderKv(headersObj) {
  const headers = Array.isArray(headersObj) ? headersObj : [];
  if (!headers.length) {
    return '<div class="har-muted" style="color:#999">No headers captured.</div>';
  }
  let sb =
    '<div class="har-kv" style="display:grid;grid-template-columns:minmax(96px,140px) 1fr;gap:2px 12px;font-size:12px;line-height:1.4">';
  for (const h of headers) {
    sb += `<div class="har-kv__k" style="color:#999;word-break:break-all;white-space:normal">${escapeHtml(stringVal(h.name))}</div>`;
    sb += `<div class="har-kv__v" style="color:#ccc;word-break:break-word;overflow-wrap:anywhere;white-space:pre-wrap">${escapeHtml(stringVal(h.value))}</div>`;
  }
  return `${sb}</div>`;
}

function buildTimingsPanel(timings, totalMs) {
  const t = timings || {};
  let sb =
    '<div class="har-kv" style="display:grid;grid-template-columns:minmax(96px,140px) 1fr;gap:2px 12px;font-size:12px;line-height:1.4">';
  for (const name of ['blocked', 'dns', 'connect', 'ssl', 'send', 'wait', 'receive']) {
    const ms = numVal(t[name], -1);
    const text = ms < 0 ? '—' : `${ms.toFixed(0)} ms`;
    sb += `<div class="har-kv__k" style="color:#999">${name}</div><div class="har-kv__v" style="color:#ccc">${text}</div>`;
  }
  sb += `<div class="har-kv__k" style="color:#999">total</div><div class="har-kv__v" style="color:#ccc">${totalMs.toFixed(0)} ms</div></div>`;
  return sb;
}

function buildResponsePanel(content, size, status, statusText) {
  let mime = stringVal(content?.mimeType);
  if (!mime) mime = '—';
  let bodyNote = 'Body not captured (meta / headers + size only).';
  if (typeof content?.text === 'string' && content.text) {
    bodyNote = content.text;
  }
  const statusLabel =
    status === 0 ? '—' : `${status}${statusText ? ` ${statusText}` : ''}`;
  return `<div class="har-kv" style="display:grid;grid-template-columns:minmax(96px,140px) 1fr;gap:2px 12px;font-size:12px;line-height:1.4">
  <div class="har-kv__k" style="color:#999">status</div><div class="har-kv__v" style="color:#ccc">${escapeHtml(statusLabel)}</div>
  <div class="har-kv__k" style="color:#999">mimeType</div><div class="har-kv__v" style="color:#ccc">${escapeHtml(mime)}</div>
  <div class="har-kv__k" style="color:#999">size</div><div class="har-kv__v" style="color:#ccc">${escapeHtml(formatBytes(size))}</div>
</div>
<div class="har-section__title" style="margin:8px 0 6px;color:#999;font-size:11px;font-weight:600;text-transform:uppercase">Body</div>
<div class="har-muted har-body" style="color:#999;font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;white-space:pre-wrap;overflow-wrap:anywhere">${escapeHtml(bodyNote)}</div>`;
}

function buildEntry(entry) {
  const req = entry.request || {};
  const res = entry.response || {};
  const timings = entry.timings || {};
  const content = res.content || {};
  let method = stringVal(req.method).toUpperCase() || 'GET';
  const url = stringVal(req.url);
  const status = numVal(res.status, 0);
  const statusText = stringVal(res.statusText);
  const size = responseSize(entry);
  const time = Math.max(numVal(entry.time, 0), 0);
  let mime = stringVal(content.mimeType);
  if (!mime) mime = '—';
  const colGrid =
    'display:grid;grid-template-columns:56px 48px minmax(0,1fr) 120px 72px 64px;gap:0 8px;align-items:center;padding:4px 8px';
  const statusLabel = status === 0 ? '—' : String(status);
  return `<tr class="har-row">
  <td style="padding:0;border-bottom:1px solid #3d444c;vertical-align:top">
    <details>
      <summary style="display:block;cursor:pointer;list-style:none;padding:0">
        <span style="${colGrid};white-space:nowrap">
          <span class="har-method" style="font-weight:600;color:#89d185">${escapeHtml(method)}</span>
          <span class="${statusClass(status)}" style="${statusColor(status)}">${statusLabel}</span>
          <span class="har-url" title="${escapeHtml(url)}" style="overflow:hidden;text-overflow:ellipsis">${escapeHtml(url)}</span>
          <span class="har-mime" style="color:#999;overflow:hidden;text-overflow:ellipsis">${escapeHtml(mime)}</span>
          <span>${escapeHtml(formatBytes(size))}</span>
          <span>${time.toFixed(0)} ms</span>
        </span>
      </summary>
      <div class="har-detail" style="padding:8px 12px 12px;background:rgba(0,0,0,0.18);white-space:normal">
        <div class="har-section__title" style="margin:0 0 6px;color:#999;font-size:11px;font-weight:600;text-transform:uppercase">Response Headers</div>
        ${buildHeaderKv(res.headers)}
        <div class="har-section__title" style="margin:10px 0 6px;color:#999;font-size:11px;font-weight:600;text-transform:uppercase">Request Headers</div>
        ${buildHeaderKv(req.headers)}
        <div class="har-section__title" style="margin:10px 0 6px;color:#999;font-size:11px;font-weight:600;text-transform:uppercase">Timings</div>
        ${buildTimingsPanel(timings, time)}
        <div class="har-section__title" style="margin:10px 0 6px;color:#999;font-size:11px;font-weight:600;text-transform:uppercase">Response</div>
        ${buildResponsePanel(content, size, status, statusText)}
      </div>
    </details>
  </td>
</tr>`;
}

function buildContent(log) {
  const entries = Array.isArray(log.entries) ? log.entries : [];
  if (!entries.length) {
    return '<div class="empty">No network entries captured.</div>';
  }
  const colGrid =
    'display:grid;grid-template-columns:56px 48px minmax(0,1fr) 120px 72px 64px;gap:0 8px;align-items:center;padding:4px 8px';
  const rows = entries.map(buildEntry).join('');
  return `<div class="har-viewer">
<div class="har-table-wrap" style="overflow:auto">
<table class="har-table" style="width:100%;border-collapse:collapse;font-size:12px;line-height:1.35;color:#ccc">
<thead><tr>
  <th style="padding:0;border-bottom:1px solid #3d444c;background:#1a1917;color:#999;font-weight:600;text-align:left">
    <div style="${colGrid}">
      <span>Method</span><span>Status</span><span>URL</span><span>Type</span><span>Size</span><span>Time</span>
    </div>
  </th>
</tr></thead>
<tbody>${rows}</tbody>
</table>
</div>
</div>`;
}

function buildSummary(log) {
  const entries = Array.isArray(log.entries) ? log.entries : [];
  let totalBytes = 0;
  let totalMs = 0;
  for (const entry of entries) {
    totalMs += Math.max(numVal(entry.time, 0), 0);
    totalBytes += responseSize(entry);
  }
  return `${entries.length} requests | ${formatBytes(totalBytes)} | ${(totalMs / 1000).toFixed(1)}s`;
}

function fillTemplate(summary, content) {
  return TEMPLATE.replace('__SUMMARY__', escapeHtml(summary)).replace(
    '__CONTENT__',
    content,
  );
}

/**
 * Server-rendered HAR viewer HTML for Allure (parity with Java HarViewerHtml).
 * @param {string|Buffer} harJson
 * @returns {string}
 */
function render(harJson) {
  if (harJson == null || (typeof harJson === 'string' && !harJson.length)) {
    throw new Error('harJson is empty');
  }
  try {
    const root = typeof harJson === 'string' ? JSON.parse(harJson) : JSON.parse(harJson.toString('utf8'));
    const log = root.log;
    if (!log || typeof log !== 'object') {
      return fillTemplate('Invalid HAR', '<div class="error">Missing log section</div>');
    }
    return fillTemplate(buildSummary(log), buildContent(log));
  } catch (ex) {
    return fillTemplate(
      'Parse error',
      `<div class="error">Failed to render HAR: ${escapeHtml(ex.message)}</div>`,
    );
  }
}

module.exports = { render };
