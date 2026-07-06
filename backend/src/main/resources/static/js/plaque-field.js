import { fetchTemplateText } from './dom-utils.js';

const TEMPLATE_URLS = [
  new URL('../templates/plaque-field.html', import.meta.url),
  new URL('../templates/plaque-field-grid.html', import.meta.url),
];

/** @type {Map<string, Element> | null} */
let templateRegistry = null;

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

/** Full-width row — label column + divider left; control slot right (plaque-field.css). */
export function applyPlaqueStretch(node) {
  if (node && node.classList && node.classList.contains('plaque-field--divided')) {
    node.classList.add('plaque-field--stretch');
  }
  return node;
}
