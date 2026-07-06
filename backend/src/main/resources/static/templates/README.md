HTML **фрагменты** для копирования в downstream-проекты.

**Fragment ≠ preview:** `templates/*.html` — кусок разметки без `<html>`, без подключения CSS/JS.  
`preview/*.html` — полные страницы каталога, tooling и exploration; собираются из примитивов, не копируются как snippet.

**Preview в monorepo:** `[page.html](file:///…/design-system/preview/page.html)` (без сервера). Rule: `frontend-preview`.

Канон размеров: `docs/component-sizes.md`.

## Template → preview

| Template (fragment) | Preview (страница) | Примечание |
|-------------------|----------------------|------------|
| `badge.html` | `components.html#section-badge` | каталог |
| `button.html` | `components.html#section-button` | exploration: `button-variants.html`, `button-color-variants.html` |
| `callout.html` | — | только в tooling (`e2e-builder.html`) |
| `chart-tile.html` | `components.html#section-chart-tile` | |
| `checkbox.html` | `components.html#section-checkbox` | |
| `checkbox-card.html` | `components.html#section-checkbox-card` | |
| `chip.html` | `components.html#section-chip` | |
| `code-highlight.html` | `components.html#section-code-highlight` | exploration: `code-highlight-variants.html` |
| `configurator-layout.html` | `configurator.html` | shell content+terminal; card-shell tooling — `panel panel--content` (не `.section`); options: `configurator-options.html`; варианты: `configurator-output-only.html`, `e2e-builder.html`, `prompt-builder.html` |
| `field-caption.html` | `components.html#section-field-caption` | |
| `grid.html` | `components.html#section-grid` | |
| `header.html` | `header.html`, `header-examples.html` | gallery: `header-variant-*.html`; mount — HTTP-only |
| `icon.html` | `components.html#section-icon` | |
| `icon-btn.html` | `components.html#section-icon-btn` | |
| `icon-copy.html` | `panel-action-icon-variants.html` | pair with `icon-reset.html` |
| `icon-reset.html` | `panel-action-icon-variants.html` | pair with `icon-copy.html` |
| `input.html` | `components.html#section-input` | |
| `label.html` | `components.html#section-label` | |
| `lang-toggle.html` | `components.html#section-lang-toggle` | |
| `link.html` | `components.html#section-link` | |
| `panel.html` | `components.html#section-panel` | sticky: `#section-sticky-panel` |
| `plaque-field.html` | `components.html#section-plaque-field` | exploration: `field-variants.html`, `boolean-plaque-variants.html`, `plaque-matrix.html` |
| `plaque-field-grid.html` | `components.html#section-plaque-field` | матрица полей — в каталоге |
| `radio.html` | `components.html#section-radio` | |
| `radio-card.html` | `components.html#section-radio-card` | |
| `section.html` | `components.html#section-section` | |
| `segmented-control.html` | `components.html#section-segmented-control` | |
| `selenoid-dashboard-row.html` | `components.html#section-selenoid-metrics` | SSE + status ×2 + metrics ряд; page: `selenoid-ui.html` |
| `selenoid-metrics.html` | `components.html#section-selenoid-metrics` | page: `selenoid-ui.html` |
| `status-tile.html` | `components.html#section-status-tile` | page: `selenoid-ui.html` |
| `stack.html` | `components.html#section-stack` | |
| `tab.html` | `components.html#section-tab` | |
| `text.html` | `components.html#section-text` | |
| `textarea.html` | `components.html#section-textarea` | |

## Preview без template

Exploration и tooling — только в `preview/`, не дублировать как fragment:

| Preview | Назначение |
|---------|------------|
| `components.html` | SSOT каталога примитивов |
| `configurator.html` | configurator shell |
| `configurator-options.html` | options layout inside `panel--content` (exploration) |
| `e2e-builder.html` | e2e configurator |
| `playground.html` | header config editor |
| `prompt-builder.html` | prompt map editor |
| `selenoid-ui.html` | Status tile + metrics (HTTP-only) |
| `allure-dashboard.html` | Allure dashboard (HTTP-only) |
| `*-variants.html` | exploration матриц (button, field, boolean, …); layout CSS — `css/variants/*-variants.css` |
