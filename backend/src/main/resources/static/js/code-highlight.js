(function (global) {
  'use strict';

  var JSON_TOKEN =
    /("(\\u[a-fA-F0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g;

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  /**
   * @param {string} json
   * @param {{ prefix?: string }} [options]
   * @returns {string}
   */
  function highlightJson(json, options) {
    var opts = options || {};
    var prefix = opts.prefix || 'ch-tok';
    var html = escapeHtml(json);

    html = html.replace(JSON_TOKEN, function (match) {
      var cls = prefix + '-str';
      if (/^"/.test(match)) {
        if (/:\s*$/.test(match)) {
          var key = match.replace(/:\s*$/, '');
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

  global.CodeHighlight = {
    escapeHtml: escapeHtml,
    highlightJson: highlightJson,
  };
})(typeof window !== 'undefined' ? window : globalThis);
