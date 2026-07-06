import { remountHeader } from './header.js';
import { syncThemeToggleIcon } from './theme-icons.js';
import { copyToClipboard } from './dom-utils.js';

const STORAGE_PAGE_THEME = 'playground-theme';

const CSS_LINKS = [
  'css/tokens.css',
  'css/link.css',
  'css/input.css',
  'css/icon.css',
  'css/icon-btn.css',
  'css/lang-toggle.css',
  'css/header.css',
  'css/page.css',
];

const brandInput = document.getElementById('playground-brand');
const navInput = document.getElementById('playground-nav');
const navError = document.getElementById('playground-nav-error');
const exportTextarea = document.getElementById('playground-export');
const copyConfigBtn = document.querySelector('[data-testid="playground-copy-config"]');
const copySnippetBtn = document.querySelector('[data-testid="playground-copy-snippet"]');
const toolbarThemeBtn = document.querySelector('[data-testid="playground-toolbar-theme"]');
const previewSection = document.querySelector('[data-testid="playground-preview"]');
const previewFrame = document.querySelector('[data-testid="playground-preview-frame"]');
const previewIframe = document.querySelector('[data-testid="playground-preview-iframe"]');

/** @param {string} jsonText */
function validateNav(jsonText) {
  let parsed;
  try {
    parsed = JSON.parse(jsonText);
  } catch (err) {
    return { ok: false, error: `Invalid JSON: ${err.message}` };
  }
  if (!Array.isArray(parsed)) {
    return { ok: false, error: 'Nav must be a JSON array' };
  }
  for (let i = 0; i < parsed.length; i += 1) {
    const item = parsed[i];
    if (!item || typeof item !== 'object' || Array.isArray(item)) {
      return { ok: false, error: `Item ${i}: must be an object` };
    }
    if (typeof item.href !== 'string' || !item.href.trim()) {
      return { ok: false, error: `Item ${i}: href must be a non-empty string` };
    }
    if (typeof item.label !== 'string' || !item.label.trim()) {
      return { ok: false, error: `Item ${i}: label must be a non-empty string` };
    }
    if (item.active !== undefined && typeof item.active !== 'boolean') {
      return { ok: false, error: `Item ${i}: active must be boolean` };
    }
    if (item.testid !== undefined && typeof item.testid !== 'string') {
      return { ok: false, error: `Item ${i}: testid must be string` };
    }
  }
  return { ok: true, nav: parsed };
}

/** @param {{ ok: boolean, error?: string }} result */
function showNavError(result) {
  if (!navError) {
    return;
  }
  if (result.ok) {
    navError.hidden = true;
    navError.textContent = '';
    navInput.removeAttribute('aria-invalid');
    return;
  }
  navError.hidden = false;
  navError.textContent = result.error ?? 'Invalid nav JSON';
  navInput.setAttribute('aria-invalid', 'true');
}

function readLangDefault() {
  const checked = document.querySelector('input[name="playground-lang"]:checked');
  return checked?.value === 'en' ? 'en' : 'ru';
}

function readThemeDefault() {
  const checked = document.querySelector('input[name="playground-theme"]:checked');
  return checked?.value === 'dark' ? 'dark' : 'light';
}

function readFormConfig() {
  const brandHref = brandInput?.value.trim() || 'https://qa.guru/';
  const navResult = validateNav(navInput?.value ?? '[]');
  showNavError(navResult);
  if (!navResult.ok) {
    return null;
  }
  return {
    brand: { href: brandHref },
    nav: navResult.nav,
    lang: { default: readLangDefault() },
    theme: { default: readThemeDefault() },
  };
}

function getPageTheme() {
  return sessionStorage.getItem(STORAGE_PAGE_THEME) === 'dark' ? 'dark' : 'light';
}

/** @param {'light' | 'dark'} theme */
function applyPageTheme(theme) {
  const isLight = theme !== 'dark';
  document.documentElement.classList.toggle('theme-light', isLight);
  sessionStorage.setItem(STORAGE_PAGE_THEME, isLight ? 'light' : 'dark');
  if (toolbarThemeBtn) {
    toolbarThemeBtn.textContent = isLight ? 'Light' : 'Dark';
  }
  syncInPlaceHeaderThemeIcon();
}

function syncInPlaceHeaderThemeIcon() {
  syncThemeToggleIcon(document.querySelector('#app-header [data-testid="header-theme-toggle"]'));
}

function syncToolbarFromDocument() {
  const isLight = document.documentElement.classList.contains('theme-light');
  if (toolbarThemeBtn) {
    toolbarThemeBtn.textContent = isLight ? 'Light' : 'Dark';
  }
  sessionStorage.setItem(STORAGE_PAGE_THEME, isLight ? 'light' : 'dark');
}

function initFormFromConfig() {
  const cfg = window.headerConfig;
  if (!cfg) {
    return;
  }
  if (cfg.brand?.href && brandInput) {
    brandInput.value = cfg.brand.href;
  }
  if (Array.isArray(cfg.nav) && navInput) {
    navInput.value = JSON.stringify(cfg.nav, null, 2);
  }
  const lang = cfg.lang?.default === 'en' ? 'en' : 'ru';
  document.querySelector(`input[name="playground-lang"][value="${lang}"]`)?.click();
  const theme = cfg.theme?.default === 'dark' ? 'dark' : 'light';
  document.querySelector(`input[name="playground-theme"][value="${theme}"]`)?.click();
}

function getViewport() {
  const checked = document.querySelector('input[name="playground-viewport"]:checked');
  return checked?.value ?? 'full';
}

/** @param {ReturnType<typeof readFormConfig>} config */
function buildPreviewSrcdoc(config) {
  const themeClass = config.theme?.default === 'dark' ? '' : 'theme-light';
  const cssTags = CSS_LINKS.map((href) => `<link rel="stylesheet" href="${href}">`).join('\n  ');
  const configJson = JSON.stringify(config, null, 2);
  return `<!DOCTYPE html>
<html lang="ru" class="${themeClass}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  ${cssTags}
</head>
<body>
  <div id="app-header"></div>
  <script>
    window.headerConfig = ${configJson};
  <\/script>
  <script type="module" src="js/header.js"><\/script>
</body>
</html>`;
}

/** @param {ReturnType<typeof readFormConfig>} config */
function buildConfigScript(config) {
  return `window.headerConfig = ${JSON.stringify(config, null, 2)};`;
}

/** @param {ReturnType<typeof readFormConfig>} config */
function buildEmbedSnippet(config) {
  return `<div id="app-header"></div>
<script>
  window.headerConfig = ${JSON.stringify(config, null, 2)};
</script>
<script type="module" src="js/header.js"></script>`;
}

/** @param {ReturnType<typeof readFormConfig>} config */
function buildExportText(config) {
  return `// window.headerConfig\n${JSON.stringify(config, null, 2)}\n\n// Embed snippet\n${buildEmbedSnippet(config)}`;
}

/** @param {ReturnType<typeof readFormConfig>} config */
function updatePreview(config) {
  if (!previewSection || !previewFrame || !previewIframe) {
    return;
  }
  const viewport = getViewport();
  if (viewport === 'full') {
    previewSection.hidden = true;
    previewIframe.removeAttribute('srcdoc');
    return;
  }
  previewSection.hidden = false;
  previewFrame.className = `playground__preview-frame playground__preview-frame--${viewport}`;
  previewIframe.srcdoc = buildPreviewSrcdoc(config);
}

/** @param {ReturnType<typeof readFormConfig>} config */
function updateExport(config) {
  if (!exportTextarea) {
    return;
  }
  exportTextarea.value = buildExportText(config);
}

let lastValidConfig = window.headerConfig ?? null;

async function syncFromForm() {
  const config = readFormConfig();
  if (!config) {
    if (lastValidConfig) {
      updateExport(lastValidConfig);
    }
    return;
  }
  lastValidConfig = config;
  window.headerConfig = config;
  await remountHeader();
  syncInPlaceHeaderThemeIcon();
  syncToolbarFromDocument();
  updatePreview(config);
  updateExport(config);
}

async function copyText(text) {
  await copyToClipboard(text);
}

function bindForm() {
  const fields = [brandInput, navInput];
  for (const field of fields) {
    field?.addEventListener('input', () => {
      void syncFromForm();
    });
  }
  for (const radio of document.querySelectorAll('input[name="playground-lang"], input[name="playground-theme"]')) {
    radio.addEventListener('change', () => {
      void syncFromForm();
    });
  }
}

function bindToolbar() {
  toolbarThemeBtn?.addEventListener('click', () => {
    const next = document.documentElement.classList.contains('theme-light') ? 'dark' : 'light';
    applyPageTheme(next);
  });

  for (const radio of document.querySelectorAll('input[name="playground-viewport"]')) {
    radio.addEventListener('change', () => {
      if (lastValidConfig) {
        updatePreview(lastValidConfig);
      }
    });
  }
}

function bindExport() {
  copyConfigBtn?.addEventListener('click', () => {
    if (!lastValidConfig) {
      return;
    }
    void copyText(buildConfigScript(lastValidConfig));
  });
  copySnippetBtn?.addEventListener('click', () => {
    if (!lastValidConfig) {
      return;
    }
    void copyText(buildEmbedSnippet(lastValidConfig));
  });
}

function init() {
  initFormFromConfig();
  bindForm();
  bindToolbar();
  bindExport();
  void syncFromForm();
}

init();
