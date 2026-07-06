import { copyToClipboard } from './dom-utils.js';

const seg = document.getElementById('configurator-headless-seg');
const output = document.getElementById('configurator-output');
const copyBtn = document.getElementById('configurator-copy');
const resetBtn = document.getElementById('configurator-reset');
if (!seg || !output) {
  throw new Error('configurator-shell.js: missing #configurator-headless-seg or #configurator-output');
}

const state = { headless: true };

function renderOutput() {
  output.textContent =
    './gradlew clean test -Denv=local_e2e \\\n' +
    '  -Dheadless=' + state.headless + ' \\\n' +
    '  -DallureReportMode=allure3';
}

function setHeadless(value) {
  state.headless = value === 'true';
  seg.querySelectorAll('.plaque-field-seg__btn').forEach(function (btn) {
    const on = btn.dataset.value === String(state.headless);
    btn.classList.toggle('plaque-field-seg__btn--on', on);
    btn.setAttribute('aria-pressed', on ? 'true' : 'false');
  });
  renderOutput();
}

function copyOutput() {
  const text = output.textContent || '';
  if (!text) {
    return;
  }

  void copyToClipboard(text, {
    onSuccess: function () {
      if (!copyBtn) {
        return;
      }
      const prev = copyBtn.getAttribute('title') || 'Копировать';
      copyBtn.setAttribute('title', 'Скопировано');
      setTimeout(function () {
        copyBtn.setAttribute('title', prev);
      }, 2000);
    },
  });
}

seg.addEventListener('click', function (event) {
  const btn = event.target.closest('.plaque-field-seg__btn');
  if (!btn || !seg.contains(btn)) {
    return;
  }
  setHeadless(btn.dataset.value);
});

if (copyBtn) {
  copyBtn.addEventListener('click', copyOutput);
}

if (resetBtn) {
  resetBtn.addEventListener('click', function () {
    setHeadless('true');
  });
}

renderOutput();
