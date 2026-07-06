import { escapeHtml } from './dom-utils.js';

const JSON_TOKEN =
  /("(\\u[a-fA-F0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g;

/* JSON_TOKEN matches literal quotes, so `"` must survive escaping (dom-utils escapeHtml turns it into &quot;). */
function escapeHtmlKeepQuotes(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * @param {string} json
 * @param {{ prefix?: string }} [options]
 * @returns {string}
 */
export function highlightJson(json, options) {
  const opts = options || {};
  const prefix = opts.prefix || 'ch-tok';
  let html = escapeHtmlKeepQuotes(json);

  html = html.replace(JSON_TOKEN, function (match) {
    let cls = prefix + '-str';
    if (/^"/.test(match)) {
      if (/:\s*$/.test(match)) {
        const key = match.replace(/:\s*$/, '');
        return (
          '<span class="' + prefix + '-key">' + key + '</span>' +
          '<span class="' + prefix + '-punct">:</span>'
        );
      }
      cls = prefix + '-str';
    } else if (match === 'true' || match === 'false') {
      cls = prefix + '-bool';
    } else if (match === 'null') {
      cls = prefix + '-null';
    } else {
      cls = prefix + '-num';
    }
    return '<span class="' + cls + '">' + match + '</span>';
  });

  html = html.replace(/([{}\[\],])/g, function (ch) {
    return '<span class="' + prefix + '-punct">' + ch + '</span>';
  });

  return html;
}

function wrapToken(prefix, cls, text) {
  return '<span class="' + prefix + '-' + cls + '">' + escapeHtml(text) + '</span>';
}

function highlightShellValue(value, prefix) {
  if (value === 'true' || value === 'false') {
    return wrapToken(prefix, 'bool', value);
  }
  if (/^-?\d+(?:\.\d+)?$/.test(value)) {
    return wrapToken(prefix, 'num', value);
  }
  return wrapToken(prefix, 'str', value);
}

function highlightShellToken(token, prefix) {
  if (/^\s*#/.test(token)) {
    return wrapToken(prefix, 'punct', token);
  }
  if (/^'/.test(token)) {
    return wrapToken(prefix, 'str', token);
  }
  if (/^\\/.test(token)) {
    return wrapToken(prefix, 'punct', token);
  }
  if (/^-D/.test(token)) {
    const eq = token.indexOf('=');
    if (eq < 0) {
      return wrapToken(prefix, 'key', token);
    }
    return (
      wrapToken(prefix, 'key', token.slice(0, eq)) +
      wrapToken(prefix, 'punct', '=') +
      highlightShellValue(token.slice(eq + 1), prefix)
    );
  }
  if (
    /^--/.test(token) ||
    token === 'export' ||
    token === 'test' ||
    token === './gradlew' ||
    token === 'gradle' ||
    token === 'allurectl' ||
    /^ALLURE_/.test(token) ||
    token === 'TEST_CASE_ID' ||
    /^-[a-zA-Z]$/.test(token)
  ) {
    return wrapToken(prefix, 'key', token);
  }
  return escapeHtml(token);
}

const SHELL_TOKEN =
  /'[^']*'|-D[\w.]+(?:=[^\s\\']*)?|--[\w-]+|\.\/gradlew|allurectl|\bgradle\b|\bexport\b|\btest\b|\b(?:ALLURE_[A-Z_]+|TEST_CASE_ID)\b|-[a-zA-Z]\b|\\\s*$|\s+#.*$/g;

/**
 * @param {string} line
 * @param {string} prefix
 * @returns {string}
 */
function highlightShellLine(line, prefix) {
  if (/^\s*#/.test(line)) {
    return wrapToken(prefix, 'punct', line);
  }

  let html = '';
  let last = 0;
  let match;

  SHELL_TOKEN.lastIndex = 0;
  while ((match = SHELL_TOKEN.exec(line)) !== null) {
    html += escapeHtml(line.slice(last, match.index));
    html += highlightShellToken(match[0], prefix);
    last = match.index + match[0].length;
  }
  html += escapeHtml(line.slice(last));
  return html;
}

/**
 * @param {string} text
 * @param {{ prefix?: string }} [options]
 * @returns {string}
 */
export function highlightShell(text, options) {
  const opts = options || {};
  const prefix = opts.prefix || 'ch-tok';
  return String(text).split('\n').map(function (line) {
    return highlightShellLine(line, prefix);
  }).join('\n');
}

export { escapeHtml };

if (typeof globalThis !== 'undefined') {
  globalThis.CodeHighlight = {
    escapeHtml: escapeHtml,
    highlightJson: highlightJson,
    highlightShell: highlightShell,
  };
}
