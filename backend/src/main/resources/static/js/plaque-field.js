const TEMPLATE_URLS = [
  new URL('../templates/plaque-field.html', import.meta.url),
  new URL('../templates/plaque-field-grid.html', import.meta.url),
];

/** @type {Map<string, Element> | null} */
let templateRegistry = null;

async function fetchTemplateText(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error('plaque-field.js: failed to load template ' + url);
  }
  return response.text();
}

function indexTemplates(root) {
  const registry = new Map();
  root.querySelectorAll('[data-testid]').forEach(function (node) {
    registry.set(node.dataset.testid, node);
  });
  return registry;
}

export async function initPlaqueTemplates() {
  if (templateRegistry) {
    return templateRegistry;
  }

  const parts = await Promise.all(TEMPLATE_URLS.map(fetchTemplateText));
  const host = document.createElement('div');
  host.innerHTML = parts.join('\n');
  templateRegistry = indexTemplates(host);
  return templateRegistry;
}

/**
 * @param {string} testid
 * @returns {Element}
 */
export function clonePlaqueTemplate(testid) {
  if (!templateRegistry) {
    throw new Error('plaque-field.js: call initPlaqueTemplates() before clonePlaqueTemplate');
  }
  const template = templateRegistry.get(testid);
  if (!template) {
    throw new Error('plaque-field.js: unknown template data-testid="' + testid + '"');
  }
  return template.cloneNode(true);
}
