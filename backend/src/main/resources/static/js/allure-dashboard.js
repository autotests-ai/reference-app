const I18N = {
  en: {
    dashboardTitle: "template-project Tests Dashboard",
    allureReportLink: "Allure Report 3",
    chartPassRate: "Pass rate",
    chartDuration: "Avg duration (s)",
    chartFailureTaxonomy: "Failure taxonomy",
    chartTestingPyramid: "Testing pyramid",
    chartEpicBreakdown: "Tests by epic",
    noFailures: "No failures in this run",
    testsPanelTitle: "Tests",
    testsColName: "Test",
    testsColStatus: "Status",
    testsColTrend: "Trend",
    testsColStability: "Stability",
    testsColDuration: "Duration",
    testsColCategory: "Category",
    stabilityFlips: "Flaky flips",
    sparklineEmpty: "No history",
    testsTableEmpty: "No tests in this run.",
    testsTableFilteredEmpty: "No tests match the selected filters.",
    testsFiltersActive: "Filters",
    testsFiltersClear: "Clear",
    testsFilterStatus: "Status",
    testsFilterCategory: "Category",
    testsFilterLayer: "Layer",
    testsFilterEpic: "Epic",
    testsPageSize: "Per page",
    testsShowing: "Showing {from}–{to} of {total}",
    testsPrevPage: "Previous page",
    testsNextPage: "Next page",
    statusPassed: "PASSED",
    statusFailed: "FAILED",
    statusBroken: "BROKEN",
    statusSkipped: "SKIPPED",
    statusUnknown: "UNKNOWN",
    categoryNone: "—",
    qualityGatePassed: "Quality gate passed",
    qualityGateFailed: "Quality gate failed",
    metricsNote:
      "Charts load from analytics-index.json after ./gradlew allureReport or test with allure results. Native dashboard in iframe below.",
    liveBadge: "Live",
    liveWaiting: "Waiting for run…",
    reportMissing:
      "No local report yet. Run: cd tests-java && ./gradlew test && ./gradlew allureReport, then ln -sfn ../tests-java/build/reports/allure-report/allureReport allure-report",
  },
  ru: {
    dashboardTitle: "Дашборд автотестов template-project",
    allureReportLink: "Allure Report 3",
    chartPassRate: "Успешность",
    chartDuration: "Средняя длительность (с)",
    chartFailureTaxonomy: "Таксономия падений",
    chartTestingPyramid: "Пирамида тестирования",
    chartEpicBreakdown: "Тесты по epic",
    noFailures: "В прогоне нет падений",
    testsPanelTitle: "Тесты",
    testsColName: "Тест",
    testsColStatus: "Статус",
    testsColTrend: "Тренд",
    testsColStability: "Стабильность",
    testsColDuration: "Длительность",
    testsColCategory: "Категория",
    stabilityFlips: "Переключения статуса",
    sparklineEmpty: "Нет истории",
    testsTableEmpty: "В прогоне нет тестов.",
    testsTableFilteredEmpty: "Нет тестов по выбранным фильтрам.",
    testsFiltersActive: "Фильтры",
    testsFiltersClear: "Сбросить",
    testsFilterStatus: "Статус",
    testsFilterCategory: "Категория",
    testsFilterLayer: "Слой",
    testsFilterEpic: "Epic",
    testsPageSize: "На странице",
    testsShowing: "Показано {from}–{to} из {total}",
    testsPrevPage: "Предыдущая страница",
    testsNextPage: "Следующая страница",
    statusPassed: "УСПЕХ",
    statusFailed: "ПАДЕНИЕ",
    statusBroken: "СБОЙ",
    statusSkipped: "ПРОПУСК",
    statusUnknown: "НЕИЗВ.",
    categoryNone: "—",
    qualityGatePassed: "Quality gate пройден",
    qualityGateFailed: "Quality gate не пройден",
    metricsNote:
      "Графики из analytics-index.json после ./gradlew allureReport или test с allure-results. Нативный дашборд — в iframe ниже.",
    liveBadge: "Live",
    liveWaiting: "Ожидание прогона…",
    reportMissing:
      "Локальный отчёт не найден. cd tests-java && ./gradlew test && ./gradlew allureReport, затем ln -sfn ../tests-java/build/reports/allure-report/allureReport allure-report",
  },
};

const DASHBOARD_CANDIDATES = [
  "allure-report/dashboard/index.html",
  "../tests-java/build/reports/allure-report/allureReport/dashboard/index.html",
];

const REPORT_CANDIDATES = [
  "allure-report/awesome/index.html",
  "../tests-java/build/reports/allure-report/allureReport/awesome/index.html",
];

const ANALYTICS_CANDIDATES = [
  "analytics-index.json",
  "allure-report/analytics-index.json",
  "../tests-java/build/analytics-index.json",
];

const LIVE_POLL_MS_DEFAULT = 500;
const LIVE_POLL_MS_MIN = 100;
const LIVE_POLL_MS_MAX = 5000;
const CHART_ANIM_MS = 350;
const TESTS_PAGE_SIZES = [10, 25, 50];
const STATUS_SORT_WEIGHT = {
  failed: 0,
  broken: 1,
  passed: 2,
  skipped: 3,
  unknown: 4,
};

const testsTableState = {
  sortKey: null,
  sortDir: "asc",
  page: 1,
  pageSize: 25,
};

const linkedFiltersState = {
  status: null,
  category: null,
  layer: null,
  epic: null,
};

let testsTableControlsWired = false;
let linkedFiltersWired = false;

let passRateChart = null;
let durationChart = null;
let failureTaxonomyChart = null;
let testingPyramidChart = null;
let epicBreakdownChart = null;
let lastAnalyticsIndex = null;
let livePollTimer = null;
let livePollingActive = false;
let liveRunObserved = false;
let lastTablePageKeys = null;

function getLivePollMs() {
  const raw = new URLSearchParams(window.location.search).get("poll");
  if (!raw) return LIVE_POLL_MS_DEFAULT;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) return LIVE_POLL_MS_DEFAULT;
  return Math.min(LIVE_POLL_MS_MAX, Math.max(LIVE_POLL_MS_MIN, Math.round(parsed)));
}

function getChartAnimMs() {
  return Math.min(CHART_ANIM_MS, Math.max(0, getLivePollMs() - 50));
}

function isLiveQueryMode() {
  return new URLSearchParams(window.location.search).get("live") === "1";
}

function shouldPollLive(index) {
  if (index?.runState === "in_progress") {
    liveRunObserved = true;
    return true;
  }
  if (index?.runState === "complete" && liveRunObserved) return false;
  if (isLiveQueryMode()) return true;
  return false;
}

function updateLiveBadge(index) {
  const badge = document.getElementById("tests-live-badge");
  if (!badge) return;

  const waiting =
    isLiveQueryMode() && (!index || (index?.runState === "complete" && !liveRunObserved));
  const running = index?.runState === "in_progress";
  const active = waiting || running;
  badge.hidden = !active;
  if (!active) return;

  if (waiting) {
    badge.textContent = t("liveWaiting");
    badge.classList.add("live-badge--waiting");
    return;
  }

  badge.classList.remove("live-badge--waiting");
  badge.textContent = t("liveBadge");
}

function destroyMetricCharts() {
  passRateChart?.destroy();
  passRateChart = null;
  durationChart?.destroy();
  durationChart = null;
  failureTaxonomyChart?.destroy();
  failureTaxonomyChart = null;
}

function startLivePolling() {
  if (livePollTimer) return;
  livePollingActive = true;
  updateLiveBadge(lastAnalyticsIndex);
  livePollTimer = window.setInterval(() => {
    refreshAnalyticsIndex();
  }, getLivePollMs());
}

function stopLivePolling() {
  if (!livePollTimer) return;
  window.clearInterval(livePollTimer);
  livePollTimer = null;
  livePollingActive = false;
  updateLiveBadge(lastAnalyticsIndex);
}

function applyAnalyticsIndex(analyticsIndex, options = {}) {
  const { liveTick = false } = options;
  lastAnalyticsIndex = analyticsIndex;

  if (liveTick && passRateChart) {
    if (!updateMetricCharts(analyticsIndex)) initCharts(analyticsIndex);
    if (!updateEpicBreakdown(analyticsIndex)) initEpicBreakdown(analyticsIndex);
    if (!updateTestingPyramid(analyticsIndex)) initTestingPyramid(analyticsIndex);
  } else {
    initCharts(analyticsIndex);
    initEpicBreakdown(analyticsIndex);
    initTestingPyramid(analyticsIndex);
  }

  initQualityGateCallout(analyticsIndex);
  initTestsTable(analyticsIndex, { incremental: liveTick });
  updateLiveBadge(analyticsIndex);

  if (shouldPollLive(analyticsIndex)) {
    startLivePolling();
    return;
  }
  stopLivePolling();
}

async function refreshAnalyticsIndex() {
  const analyticsIndex = await loadAnalyticsIndex();
  if (!analyticsIndex) {
    updateLiveBadge(null);
    return;
  }
  if (lastAnalyticsIndex?.generatedAt === analyticsIndex.generatedAt) return;
  applyAnalyticsIndex(analyticsIndex, { liveTick: true });
}

function getLang() {
  return document.documentElement.lang === "en" ? "en" : "ru";
}

function t(key) {
  const lang = getLang();
  return I18N[lang][key] || I18N.en[key] || key;
}

function applyI18n() {
  document.querySelectorAll("[data-i18n]").forEach((node) => {
    const key = node.getAttribute("data-i18n");
    if (!key) return;
    const value = t(key);
    if (node.id === "dashboard-note") {
      node.innerHTML = value.replace(
        "analytics-index.json",
        "<code>analytics-index.json</code>"
      );
      return;
    }
    node.textContent = value;
  });
}

function getSiteTheme() {
  return document.documentElement.classList.contains("theme-light") ? "light" : "dark";
}

function getChartTheme(theme) {
  const isDark = theme === "dark";
  return {
    backgroundColor: "transparent",
    textColor: isDark ? "#e2e8f0" : "#334155",
    gridColor: isDark ? "#334155" : "#e2e8f0",
    pass: isDark ? "#4ade80" : "#16a34a",
    fail: isDark ? "#f87171" : "#dc2626",
    broken: isDark ? "#fbbf24" : "#d97706",
    skip: isDark ? "#94a3b8" : "#64748b",
    accent: isDark ? "#38bdf8" : "#20aee3",
  };
}

function syncShellTheme() {
  const theme = getSiteTheme();
  document.documentElement.setAttribute("data-theme", theme);

  const frame = document.getElementById("dashboard-frame");
  if (frame && window.AllureShell) {
    AllureShell.applyDashboardTheme(frame, theme);
  }

  updateChartThemes(theme);
  initEpicBreakdown(lastAnalyticsIndex);
  initTestingPyramid(lastAnalyticsIndex);
  initTestsTable(lastAnalyticsIndex);
  updateChartFilterHighlights();
}

function updateChartThemes(theme = getSiteTheme()) {
  const palette = getChartTheme(theme);
  if (passRateChart) {
    passRateChart.update(
      {
        chart: { backgroundColor: palette.backgroundColor },
        legend: { itemStyle: { color: palette.textColor } },
      },
      false
    );
  }
  if (durationChart) {
    durationChart.update(
      {
        chart: { backgroundColor: palette.backgroundColor },
        xAxis: { labels: { style: { color: palette.textColor } } },
        yAxis: {
          gridLineColor: palette.gridColor,
          labels: { style: { color: palette.textColor } },
        },
      },
      false
    );
  }
  if (failureTaxonomyChart) {
    failureTaxonomyChart.update(
      {
        chart: { backgroundColor: palette.backgroundColor },
        legend: { itemStyle: { color: palette.textColor } },
      },
      false
    );
  }
}

async function probeUrl(path) {
  try {
    const response = await fetch(path, { method: "HEAD", cache: "no-cache" });
    return response.ok ? path : null;
  } catch {
    return null;
  }
}

async function resolveFirst(candidates) {
  for (const candidate of candidates) {
    const hit = await probeUrl(candidate);
    if (hit) return hit;
  }
  return null;
}

async function resolveDashboardUrl() {
  return resolveFirst(DASHBOARD_CANDIDATES);
}

function sampleTestsData() {
  return [
    {
      name: "LoginTests.shouldLoginWithValidCredentials",
      label: "shouldLoginWithValid…",
      status: "passed",
      durationSec: 1.24,
      failureCategory: null,
      layer: "e2e",
      flakyFlips: 0,
      history: [
        { runId: "r1", status: "passed", durationSec: 1.32 },
        { runId: "r2", status: "passed", durationSec: 1.18 },
        { runId: "r3", status: "passed", durationSec: 1.05 },
        { runId: "r4", status: "passed", durationSec: 1.24 },
      ],
    },
    {
      name: "LoginTests.shouldRejectInvalidPassword",
      label: "shouldRejectInvalid…",
      status: "passed",
      durationSec: 0.88,
      failureCategory: null,
      layer: "e2e",
      flakyFlips: 1,
      history: [
        { runId: "r1", status: "failed", durationSec: 0.95 },
        { runId: "r2", status: "passed", durationSec: 0.82 },
        { runId: "r3", status: "failed", durationSec: 0.91 },
        { runId: "r4", status: "passed", durationSec: 0.88 },
      ],
    },
    {
      name: "LogoutTests.shouldLogoutFromHeader",
      label: "shouldLogoutFromHeader",
      status: "failed",
      durationSec: 2.15,
      failureCategory: "Таймауты",
      layer: "e2e",
      flakyFlips: 2,
      history: [
        { runId: "r1", status: "passed", durationSec: 1.4 },
        { runId: "r2", status: "passed", durationSec: 1.55 },
        { runId: "r3", status: "failed", durationSec: 2.02 },
        { runId: "r4", status: "failed", durationSec: 2.15 },
      ],
    },
    {
      name: "LoginVisualTests.loginPageBaseline",
      label: "loginPageBaseline",
      status: "broken",
      durationSec: 0.42,
      failureCategory: "Ошибки проверок",
      layer: "visual",
      flakyFlips: 0,
      history: [
        { runId: "r1", status: "passed", durationSec: 0.38 },
        { runId: "r2", status: "passed", durationSec: 0.41 },
        { runId: "r3", status: "broken", durationSec: 0.42 },
      ],
    },
    {
      name: "HeaderTests.shouldRenderNavLinks",
      label: "shouldRenderNavLinks",
      status: "skipped",
      durationSec: 0,
      failureCategory: null,
      layer: "unit",
      flakyFlips: 0,
      history: [{ runId: "r1", status: "skipped", durationSec: 0 }],
    },
  ];
}

function statusLabel(status) {
  const key = `status${status.charAt(0).toUpperCase()}${status.slice(1)}`;
  return t(key) || status.toUpperCase();
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function durationBarFillClass(status) {
  if (status === "passed") return "duration-bar__fill--passed";
  if (status === "failed" || status === "broken") return "duration-bar__fill--failed";
  return "";
}

function renderDurationBar(durationSec, maxDurationSec, status) {
  const ratio = maxDurationSec > 0 ? Math.min(durationSec / maxDurationSec, 1) : 0;
  const widthPct = `${Math.round(ratio * 100)}%`;
  const fillClass = durationBarFillClass(status);
  return `
    <div class="duration-bar">
      <span class="duration-bar__value">${durationSec.toFixed(2)}s</span>
      <div class="duration-bar__track" aria-hidden="true">
        <span class="duration-bar__fill ${fillClass}" style="width:${widthPct}"></span>
      </div>
    </div>
  `;
}

function updateDurationBarCell(cell, durationSec, maxDurationSec, status) {
  const bar = cell?.querySelector(".duration-bar");
  if (!bar) {
    cell.innerHTML = renderDurationBar(durationSec, maxDurationSec, status);
    return;
  }
  const ratio = maxDurationSec > 0 ? Math.min(durationSec / maxDurationSec, 1) : 0;
  const valueEl = bar.querySelector(".duration-bar__value");
  const fillEl = bar.querySelector(".duration-bar__fill");
  const nextValue = `${durationSec.toFixed(2)}s`;
  const nextWidth = `${Math.round(ratio * 100)}%`;
  const nextFillClass = `duration-bar__fill ${durationBarFillClass(status)}`.trim();
  if (valueEl && valueEl.textContent !== nextValue) valueEl.textContent = nextValue;
  if (fillEl) {
    if (fillEl.style.width !== nextWidth) fillEl.style.width = nextWidth;
    if (fillEl.className !== nextFillClass) fillEl.className = nextFillClass;
  }
}

function testRowKey(test) {
  return test.uuid || test.historyId || test.fullName || test.name || "";
}

function createTestRow(test, maxDurationSec, theme) {
  const status = (test.status || "unknown").toLowerCase();
  const tr = document.createElement("tr");
  tr.dataset.testid = "tests-table-row";
  tr.dataset.rowKey = testRowKey(test);
  tr.dataset.status = status;

  const displayName = test.label || test.name || test.fullName || "—";
  const fullName = test.fullName || test.name || displayName;
  const category = test.failureCategory || t("categoryNone");

  tr.innerHTML = `
    <td class="tests-table__name" title="${escapeHtml(fullName)}">${escapeHtml(displayName)}</td>
    <td class="tests-table__status">
      <span class="badge badge--status-${status}">${escapeHtml(statusLabel(status))}</span>
    </td>
    <td class="tests-table__trend">${renderDurationSparkline(test.history, theme)}</td>
    <td class="tests-table__stability">${renderStabilityCell(test.flakyFlips, test.history, theme)}</td>
    <td class="tests-table__duration">
      ${renderDurationBar(test.durationSec ?? 0, maxDurationSec, status)}
    </td>
    <td class="tests-table__category">${escapeHtml(category)}</td>
  `;
  return tr;
}

function updateTestRowCells(tr, test, maxDurationSec, theme) {
  const status = (test.status || "unknown").toLowerCase();
  tr.dataset.status = status;

  const badge = tr.querySelector(".tests-table__status .badge");
  if (badge) {
    const nextClass = `badge badge--status-${status}`;
    const nextLabel = statusLabel(status);
    if (badge.className !== nextClass) badge.className = nextClass;
    if (badge.textContent !== nextLabel) badge.textContent = nextLabel;
  }

  const trendCell = tr.querySelector(".tests-table__trend");
  if (trendCell) {
    const nextTrend = renderDurationSparkline(test.history, theme);
    if (trendCell.innerHTML !== nextTrend) trendCell.innerHTML = nextTrend;
  }

  const stabilityCell = tr.querySelector(".tests-table__stability");
  if (stabilityCell) {
    const nextStability = renderStabilityCell(test.flakyFlips, test.history, theme);
    if (stabilityCell.innerHTML !== nextStability) stabilityCell.innerHTML = nextStability;
  }

  updateDurationBarCell(
    tr.querySelector(".tests-table__duration"),
    test.durationSec ?? 0,
    maxDurationSec,
    status
  );

  const categoryCell = tr.querySelector(".tests-table__category");
  const category = test.failureCategory || t("categoryNone");
  if (categoryCell && categoryCell.textContent !== category) {
    categoryCell.textContent = category;
  }
}

function statusSparkColor(status, theme) {
  const normalized = (status || "unknown").toLowerCase();
  if (normalized === "passed") return theme.pass;
  if (normalized === "failed") return theme.fail;
  if (normalized === "broken") return theme.broken;
  return theme.skip;
}

function renderDurationSparkline(history, theme) {
  const points = (history ?? []).filter((point) => typeof point.durationSec === "number");
  if (points.length < 2) {
    return `<span class="sparkline sparkline--empty">${escapeHtml(t("sparklineEmpty"))}</span>`;
  }

  const values = points.map((point) => point.durationSec);
  const width = 88;
  const height = 28;
  const pad = 2;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const coords = values.map((value, index) => {
    const x = pad + (index / (values.length - 1)) * (width - pad * 2);
    const y = pad + (1 - (value - min) / range) * (height - pad * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const polyline = coords.join(" ");
  const area = `${pad},${height - pad} ${polyline} ${width - pad},${height - pad}`;
  const label = values.map((value, index) => `R${index + 1}: ${value.toFixed(2)}s`).join(" · ");

  return `
    <svg
      class="sparkline sparkline--duration"
      width="${width}"
      height="${height}"
      viewBox="0 0 ${width} ${height}"
      role="img"
      aria-label="${escapeHtml(label)}"
    >
      <title>${escapeHtml(label)}</title>
      <polygon class="sparkline__area" points="${area}" fill="${theme.accent}" fill-opacity="0.14" />
      <polyline
        class="sparkline__line"
        points="${polyline}"
        fill="none"
        stroke="${theme.accent}"
        stroke-width="1.5"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </svg>
  `;
}

function renderStabilityCell(flakyFlips, history, theme) {
  const runs = (history ?? []).slice(-10);
  const flips = flakyFlips ?? 0;
  const dots = runs
    .map((point) => {
      const color = statusSparkColor(point.status, theme);
      const status = (point.status || "unknown").toLowerCase();
      return `<span class="stability-dot stability-dot--${status}" style="background:${color}" title="${escapeHtml(statusLabel(status))}"></span>`;
    })
    .join("");
  const flipBadge =
    flips > 0
      ? `<span class="badge badge--flaky" title="${escapeHtml(`${t("stabilityFlips")}: ${flips}`)}">${flips}</span>`
      : "";

  return `
    <div class="stability-cell">
      ${flipBadge}
      <span class="stability-dots" aria-hidden="true">${dots || "—"}</span>
    </div>
  `;
}

function formatTemplate(key, vars) {
  return Object.entries(vars).reduce(
    (text, [name, value]) => text.replace(`{${name}}`, String(value)),
    t(key)
  );
}

function compareTests(a, b, sortKey) {
  if (sortKey === "name") {
    const left = (a.label || a.name || a.fullName || "").toLowerCase();
    const right = (b.label || b.name || b.fullName || "").toLowerCase();
    return left.localeCompare(right);
  }
  if (sortKey === "status") {
    const left = STATUS_SORT_WEIGHT[(a.status || "unknown").toLowerCase()] ?? 99;
    const right = STATUS_SORT_WEIGHT[(b.status || "unknown").toLowerCase()] ?? 99;
    return left - right;
  }
  if (sortKey === "duration") {
    return (a.durationSec ?? 0) - (b.durationSec ?? 0);
  }
  if (sortKey === "stability") {
    return (a.flakyFlips ?? 0) - (b.flakyFlips ?? 0);
  }
  if (sortKey === "category") {
    const left = (a.failureCategory || "").toLowerCase();
    const right = (b.failureCategory || "").toLowerCase();
    return left.localeCompare(right);
  }
  return 0;
}

function sortTests(tests) {
  if (!testsTableState.sortKey) return tests;
  const sorted = [...tests].sort((left, right) =>
    compareTests(left, right, testsTableState.sortKey)
  );
  if (testsTableState.sortDir === "desc") sorted.reverse();
  return sorted;
}

function paginateTests(tests) {
  const total = tests.length;
  const pageSize = testsTableState.pageSize;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (testsTableState.page > totalPages) testsTableState.page = totalPages;
  if (testsTableState.page < 1) testsTableState.page = 1;

  const start = (testsTableState.page - 1) * pageSize;
  const end = Math.min(start + pageSize, total);
  return {
    rows: tests.slice(start, end),
    total,
    totalPages,
    from: total ? start + 1 : 0,
    to: end,
  };
}

function updateTestsTableSortButtons() {
  document.querySelectorAll(".tests-table__sort").forEach((button) => {
    const key = button.dataset.sort;
    if (key === testsTableState.sortKey) {
      button.setAttribute(
        "aria-sort",
        testsTableState.sortDir === "asc" ? "ascending" : "descending"
      );
      return;
    }
    button.setAttribute("aria-sort", "none");
  });
}

function updateTestsTableToolbar({ total, totalPages, from, to }) {
  const toolbar = document.getElementById("tests-table-toolbar");
  const summary = document.getElementById("tests-table-summary");
  const pageInfo = document.getElementById("tests-table-page-info");
  const prev = document.getElementById("tests-table-prev");
  const next = document.getElementById("tests-table-next");
  const pageSizeSelect = document.getElementById("tests-table-page-size");

  if (!toolbar || !summary || !pageInfo || !prev || !next || !pageSizeSelect) return;

  const showPagination = total > testsTableState.pageSize;
  toolbar.hidden = total === 0;
  summary.textContent = formatTemplate("testsShowing", { from, to, total });
  pageInfo.textContent = `${testsTableState.page} / ${totalPages}`;
  prev.disabled = testsTableState.page <= 1;
  next.disabled = testsTableState.page >= totalPages;
  prev.setAttribute("aria-label", t("testsPrevPage"));
  next.setAttribute("aria-label", t("testsNextPage"));
  pageSizeSelect.value = String(testsTableState.pageSize);
  pageSizeSelect.closest(".tests-table-page-size").hidden = !showPagination && total <= TESTS_PAGE_SIZES[0];
  prev.closest(".tests-table-pagination").hidden = !showPagination;
}

function toggleTestsTableSort(sortKey) {
  if (testsTableState.sortKey === sortKey) {
    if (testsTableState.sortDir === "asc") {
      testsTableState.sortDir = "desc";
    } else {
      testsTableState.sortKey = null;
      testsTableState.sortDir = "asc";
    }
  } else {
    testsTableState.sortKey = sortKey;
    testsTableState.sortDir = "asc";
  }
  testsTableState.page = 1;
  initTestsTable(lastAnalyticsIndex);
}

function statusFromChartName(name) {
  const normalized = (name || "").toLowerCase();
  if (normalized.startsWith("pass")) return "passed";
  if (normalized.startsWith("fail")) return "failed";
  if (normalized.startsWith("brok")) return "broken";
  if (normalized.startsWith("skip")) return "skipped";
  return "unknown";
}

function applyLinkedFilters(tests) {
  return tests.filter((test) => {
    if (linkedFiltersState.status) {
      const status = (test.status || "unknown").toLowerCase();
      if (status !== linkedFiltersState.status) return false;
    }
    if (linkedFiltersState.category) {
      const category = test.failureCategory || t("categoryNone");
      if (category !== linkedFiltersState.category) return false;
    }
    if (linkedFiltersState.layer && test.layer !== linkedFiltersState.layer) return false;
    if (linkedFiltersState.epic && test.epic !== linkedFiltersState.epic) return false;
    return true;
  });
}

function toggleLinkedFilter(type, value) {
  if (!value) return;
  linkedFiltersState[type] = linkedFiltersState[type] === value ? null : value;
  testsTableState.page = 1;
  initTestsTable(lastAnalyticsIndex);
  updateLinkedFilterUi();
  updateChartFilterHighlights();
}

function clearLinkedFilters() {
  linkedFiltersState.status = null;
  linkedFiltersState.category = null;
  linkedFiltersState.layer = null;
  linkedFiltersState.epic = null;
  testsTableState.page = 1;
  initTestsTable(lastAnalyticsIndex);
  updateLinkedFilterUi();
  updateChartFilterHighlights();
}

function linkedFilterChipLabel(type, value) {
  if (type === "status") {
    return `${t("testsFilterStatus")}: ${statusLabel(value)}`;
  }
  if (type === "category") {
    return `${t("testsFilterCategory")}: ${value}`;
  }
  if (type === "layer") {
    return `${t("testsFilterLayer")}: ${value}`;
  }
  if (type === "epic") {
    return `${t("testsFilterEpic")}: ${value}`;
  }
  return value;
}

function updateLinkedFilterUi() {
  const bar = document.getElementById("tests-filters");
  const chips = document.getElementById("tests-filters-chips");
  if (!bar || !chips) return;

  const active = [
    linkedFiltersState.status ? { type: "status", value: linkedFiltersState.status } : null,
    linkedFiltersState.category ? { type: "category", value: linkedFiltersState.category } : null,
    linkedFiltersState.layer ? { type: "layer", value: linkedFiltersState.layer } : null,
    linkedFiltersState.epic ? { type: "epic", value: linkedFiltersState.epic } : null,
  ].filter(Boolean);

  bar.hidden = active.length === 0;
  chips.innerHTML = active
    .map(
      (entry) =>
        `<span class="tests-filter-chip" data-filter-type="${escapeHtml(entry.type)}">
          <span class="tests-filter-chip__key">${escapeHtml(linkedFilterChipLabel(entry.type, entry.value))}</span>
        </span>`
    )
    .join("");
}

function highlightPieSelection(chart, isSelected) {
  if (!chart?.series?.[0]?.data) return;
  chart.series[0].data.forEach((point) => {
    const selected = isSelected(point);
    point.update({ opacity: selected ? 1 : 0.35, sliced: selected }, false);
  });
  chart.redraw(false);
}

function highlightBarSelection(chart, selectedIndex) {
  if (!chart?.series?.[0]?.data) return;
  chart.series[0].data.forEach((point, index) => {
    point.update({ opacity: selectedIndex === null || index === selectedIndex ? 1 : 0.35 }, false);
  });
  chart.redraw(false);
}

function updateChartFilterHighlights() {
  highlightPieSelection(passRateChart, (point) => {
    if (!linkedFiltersState.status) return true;
    const status = point.options?.status || statusFromChartName(point.name);
    return status === linkedFiltersState.status;
  });

  highlightPieSelection(failureTaxonomyChart, (point) => {
    if (!linkedFiltersState.category) return true;
    return point.name === linkedFiltersState.category;
  });

  if (testingPyramidChart) {
    const categories = testingPyramidChart.xAxis?.[0]?.categories ?? [];
    const selectedIndex = linkedFiltersState.layer
      ? categories.indexOf(linkedFiltersState.layer)
      : null;
    highlightBarSelection(testingPyramidChart, selectedIndex >= 0 ? selectedIndex : null);
  }

  if (epicBreakdownChart) {
    const categories = epicBreakdownChart.xAxis?.[0]?.categories ?? [];
    const selectedIndex = linkedFiltersState.epic
      ? categories.indexOf(linkedFiltersState.epic)
      : null;
    highlightBarSelection(epicBreakdownChart, selectedIndex >= 0 ? selectedIndex : null);
  }
}

function wireLinkedFilters() {
  if (linkedFiltersWired) return;
  linkedFiltersWired = true;
  document.getElementById("tests-filters-clear")?.addEventListener("click", clearLinkedFilters);
}

function piePointClickHandler(filterType) {
  return function onPointClick() {
    if (filterType === "status") {
      const status = this.options?.status || statusFromChartName(this.name);
      toggleLinkedFilter("status", status);
      return;
    }
    if (filterType === "category") {
      toggleLinkedFilter("category", this.name);
    }
  };
}

function wireTestsTableControls() {
  if (testsTableControlsWired) return;
  testsTableControlsWired = true;

  document.querySelectorAll(".tests-table__sort").forEach((button) => {
    button.addEventListener("click", () => {
      toggleTestsTableSort(button.dataset.sort);
    });
  });

  document.getElementById("tests-table-prev")?.addEventListener("click", () => {
    if (testsTableState.page <= 1) return;
    testsTableState.page -= 1;
    initTestsTable(lastAnalyticsIndex);
  });

  document.getElementById("tests-table-next")?.addEventListener("click", () => {
    testsTableState.page += 1;
    initTestsTable(lastAnalyticsIndex);
  });

  document.getElementById("tests-table-page-size")?.addEventListener("change", (event) => {
    testsTableState.pageSize = Number(event.target.value) || 25;
    testsTableState.page = 1;
    initTestsTable(lastAnalyticsIndex);
  });
}

function renderTestsTable(tests, fromIndex = false, { incremental = false } = {}) {
  wireTestsTableControls();
  wireLinkedFilters();

  const table = document.getElementById("tests-table");
  const body = document.getElementById("tests-table-body");
  const empty = document.getElementById("tests-table-empty");
  if (!table || !body || !empty) return;

  const sourceRows = tests?.length ? tests : fromIndex ? [] : sampleTestsData();
  const filteredRows = applyLinkedFilters(sourceRows);
  const sortedRows = sortTests(filteredRows);
  const { rows, total, totalPages, from, to } = paginateTests(sortedRows);
  updateLinkedFilterUi();

  if (!sourceRows.length) {
    body.innerHTML = "";
    lastTablePageKeys = null;
    table.hidden = true;
    empty.hidden = false;
    empty.textContent = t("testsTableEmpty");
    updateTestsTableToolbar({ total: 0, totalPages: 1, from: 0, to: 0 });
    updateTestsTableSortButtons();
    return;
  }

  if (!filteredRows.length) {
    body.innerHTML = "";
    lastTablePageKeys = null;
    table.hidden = true;
    empty.hidden = false;
    empty.textContent = t("testsTableFilteredEmpty");
    updateTestsTableToolbar({ total: 0, totalPages: 1, from: 0, to: 0 });
    updateTestsTableSortButtons();
    return;
  }

  const maxDurationSec = filteredRows.reduce(
    (max, test) => Math.max(max, test.durationSec ?? 0),
    0
  );
  const theme = getChartTheme(getSiteTheme());
  const rowKeys = rows.map(testRowKey);
  const canIncremental =
    incremental &&
    lastTablePageKeys &&
    rowKeys.length > 0 &&
    rowKeys.length === lastTablePageKeys.length &&
    rowKeys.every((key, index) => key === lastTablePageKeys[index]);
  const existingRows = canIncremental ? [...body.querySelectorAll("tr")] : [];

  if (canIncremental) {
    rows.forEach((test, index) => {
      const tr = existingRows[index];
      if (tr?.dataset.rowKey === rowKeys[index]) {
        updateTestRowCells(tr, test, maxDurationSec, theme);
      }
    });
  } else {
    body.innerHTML = "";
    rows.forEach((test) => {
      body.appendChild(createTestRow(test, maxDurationSec, theme));
    });
    lastTablePageKeys = rowKeys;
  }

  empty.hidden = true;
  table.hidden = false;
  updateTestsTableToolbar({ total, totalPages, from, to });
  updateTestsTableSortButtons();
}

function initTestsTable(analyticsIndex, options = {}) {
  const tests = analyticsIndex?.tests;
  renderTestsTable(tests, Boolean(analyticsIndex), options);
}

function renderQualityGateCallout(qualityGate) {
  const callout = document.getElementById("quality-gate-callout");
  if (!callout) return;

  const rules = qualityGate?.rules ?? [];
  if (!rules.length) {
    callout.hidden = true;
    callout.innerHTML = "";
    callout.className = "callout";
    return;
  }

  const passed = Boolean(qualityGate.passed);
  callout.hidden = false;
  callout.className = `callout callout--${passed ? "success" : "warning"}`;
  const title = passed ? t("qualityGatePassed") : t("qualityGateFailed");
  const failedRules = rules.filter((rule) => !rule.passed);

  if (passed) {
    callout.innerHTML = `<p class="callout__title">${escapeHtml(title)}</p>`;
    return;
  }

  const items = failedRules
    .map(
      (rule) =>
        `<li>${escapeHtml(rule.message)} <span class="quality-gate-rule__id">${escapeHtml(rule.id)}</span></li>`
    )
    .join("");
  callout.innerHTML = `<p class="callout__title">${escapeHtml(title)}</p><ul class="callout__list">${items}</ul>`;
}

function initQualityGateCallout(analyticsIndex) {
  renderQualityGateCallout(analyticsIndex?.qualityGate);
}

function pyramidBarColor(successRate, theme) {
  if (successRate >= 100) return theme.pass;
  if (successRate >= 90) return theme.accent;
  if (successRate > 0) return theme.broken;
  return theme.skip;
}

function initEpicBreakdown(chartData) {
  const slot = document.getElementById("chart-epic-breakdown");
  const tile = document.querySelector('[data-testid="chart-epic-breakdown"]');
  if (!slot || !tile || !window.Highcharts) return;

  const rows = (chartData?.charts?.epicBreakdown ?? []).filter((row) => row.y > 0);
  if (!rows.length) {
    tile.hidden = true;
    epicBreakdownChart?.destroy();
    epicBreakdownChart = null;
    slot.innerHTML = "";
    slot.classList.remove("chart-tile__empty");
    return;
  }

  tile.hidden = false;
  slot.classList.remove("chart-tile__empty");
  epicBreakdownChart?.destroy();
  epicBreakdownChart = null;
  slot.innerHTML = "";
  const theme = getChartTheme(getSiteTheme());
  const categories = rows.map((row) => row.name);
  const data = rows.map((row) => ({
    y: row.y,
    color: row.color || theme.accent,
  }));

  epicBreakdownChart = Highcharts.chart("chart-epic-breakdown", {
    chart: {
      type: "bar",
      backgroundColor: theme.backgroundColor,
      height: Math.max(120, rows.length * 28),
      spacing: [8, 8, 4, 0],
    },
    credits: { enabled: false },
    title: { text: null },
    xAxis: {
      categories,
      labels: { style: { color: theme.textColor, fontSize: "11px" } },
      lineColor: theme.gridColor,
      tickLength: 0,
    },
    yAxis: {
      min: 0,
      allowDecimals: false,
      gridLineColor: theme.gridColor,
      title: { text: null },
      labels: { style: { color: theme.textColor, fontSize: "10px" } },
    },
    legend: { enabled: false },
    tooltip: {
      pointFormat: "<b>{point.y}</b> tests",
    },
    plotOptions: {
      bar: {
        borderRadius: 3,
        pointPadding: 0.12,
        groupPadding: 0.08,
        cursor: "pointer",
        colorByPoint: true,
        point: {
          events: {
            click: function onEpicBarClick() {
              toggleLinkedFilter("epic", categories[this.index]);
            },
          },
        },
        dataLabels: {
          enabled: true,
          style: { color: theme.textColor, fontSize: "10px", textOutline: "none" },
          format: "{y}",
        },
      },
    },
    series: [{ name: "Tests", data }],
  });
  updateChartFilterHighlights();
}

function initTestingPyramid(chartData) {
  const slot = document.getElementById("chart-testing-pyramid");
  const tile = document.querySelector('[data-testid="chart-testing-pyramid"]');
  if (!slot || !tile || !window.Highcharts) return;

  const rows = (chartData?.charts?.testingPyramid ?? []).filter((row) => row.testCount > 0);
  if (!rows.length) {
    tile.hidden = true;
    testingPyramidChart?.destroy();
    testingPyramidChart = null;
    slot.innerHTML = "";
    slot.classList.remove("chart-tile__empty");
    return;
  }

  tile.hidden = false;
  slot.classList.remove("chart-tile__empty");
  testingPyramidChart?.destroy();
  testingPyramidChart = null;
  slot.innerHTML = "";
  const theme = getChartTheme(getSiteTheme());
  const categories = rows.map((row) => row.layer);
  const data = rows.map((row) => ({
    y: row.testCount,
    successRate: row.successRate,
    color: pyramidBarColor(row.successRate, theme),
  }));

  testingPyramidChart = Highcharts.chart("chart-testing-pyramid", {
    chart: {
      type: "bar",
      backgroundColor: theme.backgroundColor,
      height: Math.max(140, rows.length * 28),
      spacing: [8, 8, 4, 0],
    },
    credits: { enabled: false },
    title: { text: null },
    xAxis: {
      categories,
      labels: { style: { color: theme.textColor, fontSize: "11px" } },
      lineColor: theme.gridColor,
      tickLength: 0,
    },
    yAxis: {
      min: 0,
      allowDecimals: false,
      gridLineColor: theme.gridColor,
      title: { text: null },
      labels: { style: { color: theme.textColor, fontSize: "10px" } },
    },
    legend: { enabled: false },
    tooltip: {
      pointFormat: "<b>{point.y}</b> tests · {point.successRate}% passed",
    },
    plotOptions: {
      bar: {
        borderRadius: 3,
        pointPadding: 0.12,
        groupPadding: 0.08,
        cursor: "pointer",
        point: {
          events: {
            click: function onPyramidBarClick() {
              toggleLinkedFilter("layer", categories[this.index]);
            },
          },
        },
        dataLabels: {
          enabled: true,
          style: { color: theme.textColor, fontSize: "10px", textOutline: "none" },
          format: "{y}",
        },
      },
    },
    series: [{ name: "Tests", data }],
  });
  updateChartFilterHighlights();
}

function sampleChartData(theme) {
  return {
    passRate: [
      { name: "Passed", y: 42, status: "passed", color: theme.pass },
      { name: "Failed", y: 3, status: "failed", color: theme.fail },
      { name: "Broken", y: 1, status: "broken", color: theme.broken },
      { name: "Skipped", y: 2, status: "skipped", color: theme.skip },
    ],
    duration: {
      categories: ["R1", "R2", "R3", "R4", "R5", "R6", "R7"],
      valuesSec: [1.2, 0.95, 1.1, 0.88, 1.02, 1.15, 0.91],
    },
    failureTaxonomy: [
      { name: "Таймауты", y: 2, color: theme.fail },
      { name: "Ошибки проверок", y: 1, color: theme.broken },
      { name: "Прочее", y: 1, color: theme.skip },
    ],
    epicBreakdown: [
      { name: "One Page Form", y: 3, color: theme.accent },
      { name: "Component Catalog", y: 2, color: theme.pass },
    ],
  };
}

function mapPassRateSeries(series, theme) {
  const palette = {
    passed: theme.pass,
    failed: theme.fail,
    broken: theme.broken,
    skipped: theme.skip,
    unknown: theme.skip,
  };
  return (series ?? []).map((point) => ({
    ...point,
    color: point.color || palette[point.status] || theme.accent,
  }));
}

function resolveMetricChartPayload(chartData, theme) {
  const fallback = sampleChartData(theme);
  const passRate = mapPassRateSeries(chartData?.charts?.passRate, theme);
  const duration = chartData?.charts?.duration ?? fallback.duration;
  return {
    passRateData: passRate.length ? passRate : fallback.passRate,
    durationCategories: duration.categories?.length ? duration.categories : fallback.duration.categories,
    durationValues: duration.valuesSec?.length ? duration.valuesSec : fallback.duration.valuesSec,
    failureTaxonomy: chartData ? (chartData.charts?.failureTaxonomy ?? []) : fallback.failureTaxonomy,
  };
}

function updateMetricCharts(chartData) {
  if (!window.Highcharts || !passRateChart || !durationChart) return false;

  const theme = getChartTheme(getSiteTheme());
  const { passRateData, durationCategories, durationValues, failureTaxonomy } =
    resolveMetricChartPayload(chartData, theme);
  const anim = { duration: getChartAnimMs() };

  passRateChart.series[0].setData(passRateData, true, anim);
  durationChart.xAxis[0].setCategories(durationCategories, false);
  durationChart.series[0].setData(durationValues, true, anim);

  if (failureTaxonomy.length) {
    if (failureTaxonomyChart) {
      failureTaxonomyChart.series[0].setData(failureTaxonomy, true, anim);
    } else {
      return false;
    }
  } else if (failureTaxonomyChart) {
    return false;
  }

  updateChartFilterHighlights();
  return true;
}

function updateEpicBreakdown(chartData) {
  if (!window.Highcharts) return false;

  const rows = (chartData?.charts?.epicBreakdown ?? []).filter((row) => row.y > 0);
  const slot = document.getElementById("chart-epic-breakdown");
  const tile = document.querySelector('[data-testid="chart-epic-breakdown"]');
  if (!slot || !tile) return false;

  if (!rows.length) return !epicBreakdownChart;
  if (!epicBreakdownChart) return false;

  const theme = getChartTheme(getSiteTheme());
  const categories = rows.map((row) => row.name);
  const data = rows.map((row) => ({
    y: row.y,
    color: row.color || theme.accent,
  }));
  const currentCategories = epicBreakdownChart.xAxis?.[0]?.categories ?? [];
  if (currentCategories.length !== categories.length) return false;

  epicBreakdownChart.update({ chart: { height: Math.max(120, rows.length * 28) } }, false);
  epicBreakdownChart.xAxis[0].setCategories(categories, false);
  epicBreakdownChart.series[0].setData(data, true, { duration: getChartAnimMs() });
  updateChartFilterHighlights();
  return true;
}

function updateTestingPyramid(chartData) {
  if (!window.Highcharts) return false;

  const rows = (chartData?.charts?.testingPyramid ?? []).filter((row) => row.testCount > 0);
  const slot = document.getElementById("chart-testing-pyramid");
  const tile = document.querySelector('[data-testid="chart-testing-pyramid"]');
  if (!slot || !tile) return false;

  if (!rows.length) return !testingPyramidChart;
  if (!testingPyramidChart) return false;

  const theme = getChartTheme(getSiteTheme());
  const categories = rows.map((row) => row.layer);
  const data = rows.map((row) => ({
    y: row.testCount,
    successRate: row.successRate,
    color: pyramidBarColor(row.successRate, theme),
  }));
  const currentCategories = testingPyramidChart.xAxis?.[0]?.categories ?? [];
  if (currentCategories.length !== categories.length) return false;

  testingPyramidChart.update({ chart: { height: Math.max(140, rows.length * 28) } }, false);
  testingPyramidChart.xAxis[0].setCategories(categories, false);
  testingPyramidChart.series[0].setData(data, true, { duration: getChartAnimMs() });
  updateChartFilterHighlights();
  return true;
}

async function loadAnalyticsIndex() {
  const url = await resolveFirst(ANALYTICS_CANDIDATES);
  if (!url) return null;
  try {
    const response = await fetch(url, { cache: "no-cache" });
    if (!response.ok) return null;
    return response.json();
  } catch {
    return null;
  }
}

function initCharts(chartData) {
  if (!window.Highcharts) return;

  destroyMetricCharts();

  const theme = getChartTheme(getSiteTheme());
  const { passRateData, durationCategories, durationValues, failureTaxonomy } =
    resolveMetricChartPayload(chartData, theme);

  passRateChart = Highcharts.chart("chart-pass-rate", {
    chart: {
      type: "pie",
      backgroundColor: theme.backgroundColor,
      height: 140,
      spacing: [0, 0, 0, 0],
    },
    credits: { enabled: false },
    title: { text: null },
    tooltip: { pointFormat: "<b>{point.y}</b> ({point.percentage:.1f}%)" },
    plotOptions: {
      pie: {
        innerSize: "58%",
        dataLabels: { enabled: false },
        showInLegend: true,
        cursor: "pointer",
        point: {
          events: {
            click: piePointClickHandler("status"),
          },
        },
      },
    },
    legend: {
      align: "right",
      verticalAlign: "middle",
      layout: "vertical",
      itemStyle: { color: theme.textColor, fontSize: "11px" },
    },
    series: [{ name: "Tests", data: passRateData }],
  });

  durationChart = Highcharts.chart("chart-duration", {
    chart: {
      type: "column",
      backgroundColor: theme.backgroundColor,
      height: 140,
      spacing: [8, 0, 4, 0],
    },
    credits: { enabled: false },
    title: { text: null },
    xAxis: {
      categories: durationCategories,
      labels: { style: { color: theme.textColor, fontSize: "10px" } },
      lineColor: theme.gridColor,
      tickLength: 0,
    },
    yAxis: {
      min: 0,
      gridLineColor: theme.gridColor,
      title: { text: null },
      labels: { style: { color: theme.textColor, fontSize: "10px" } },
    },
    legend: { enabled: false },
    tooltip: { valueSuffix: " s" },
    plotOptions: {
      column: {
        borderRadius: 3,
        color: theme.accent,
        pointPadding: 0.15,
        groupPadding: 0.08,
      },
    },
    series: [{ name: "Duration", data: durationValues }],
  });

  failureTaxonomyChart = null;
  const failureTaxonomySlot = document.getElementById("chart-failure-taxonomy");
  if (failureTaxonomySlot) {
    failureTaxonomySlot.classList.remove("chart-tile__empty");
    failureTaxonomySlot.textContent = "";
  }
  if (failureTaxonomy.length && failureTaxonomySlot) {
    failureTaxonomyChart = Highcharts.chart("chart-failure-taxonomy", {
      chart: {
        type: "pie",
        backgroundColor: theme.backgroundColor,
        height: 140,
        spacing: [0, 0, 0, 0],
      },
      credits: { enabled: false },
      title: { text: null },
      tooltip: { pointFormat: "<b>{point.y}</b> ({point.percentage:.1f}%)" },
      plotOptions: {
        pie: {
          innerSize: "58%",
          dataLabels: { enabled: false },
          showInLegend: true,
          cursor: "pointer",
          point: {
            events: {
              click: piePointClickHandler("category"),
            },
          },
        },
      },
      legend: {
        align: "right",
        verticalAlign: "middle",
        layout: "vertical",
        itemStyle: { color: theme.textColor, fontSize: "11px" },
      },
      series: [{ name: "Failures", data: failureTaxonomy }],
    });
  } else if (chartData && failureTaxonomySlot) {
    failureTaxonomySlot.textContent = t("noFailures");
    failureTaxonomySlot.classList.add("chart-tile__empty");
  }

  updateChartFilterHighlights();
}

async function waitForHeaderToggle() {
  const deadline = Date.now() + 5000;
  while (Date.now() < deadline) {
    const toggle = document.querySelector('[data-testid="header-theme-toggle"]');
    if (toggle) return toggle;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  return null;
}

async function wireDashboardFrame(dashboardUrl) {
  const frame = document.getElementById("dashboard-frame");
  if (!frame || !window.AllureShell) return;

  if (dashboardUrl) {
    frame.dataset.dashboardUrl = dashboardUrl;
    const reportRoot = dashboardUrl.replace(/dashboard\/index\.html$/, "");
    const titleLink = document.getElementById("dashboard-title-link");
    const reportLink = document.getElementById("full-report-link");
    if (titleLink) titleLink.href = dashboardUrl;
    if (reportLink) {
      const awesome = await resolveFirst([
        `${reportRoot}awesome/index.html`,
        ...REPORT_CANDIDATES,
      ]);
      reportLink.href = awesome || dashboardUrl;
    }
    AllureShell.loadDashboardFrame(frame, dashboardUrl);
    return;
  }

  const note = document.getElementById("dashboard-note");
  if (note) {
    note.textContent = t("reportMissing");
  }
}

async function init() {
  applyI18n();
  syncShellTheme();
  if (isLiveQueryMode()) {
    startLivePolling();
    updateLiveBadge(null);
  }
  const analyticsIndex = await loadAnalyticsIndex();
  applyAnalyticsIndex(analyticsIndex);

  const themeToggle = await waitForHeaderToggle();
  themeToggle?.addEventListener("click", () => {
    requestAnimationFrame(syncShellTheme);
  });

  document.addEventListener("header:lang-change", () => {
    applyI18n();
    const failureSlot = document.getElementById("chart-failure-taxonomy");
    if (failureSlot?.classList.contains("chart-tile__empty")) {
      failureSlot.textContent = t("noFailures");
    }
    initTestsTable(lastAnalyticsIndex);
    initQualityGateCallout(lastAnalyticsIndex);
    initEpicBreakdown(lastAnalyticsIndex);
    initTestingPyramid(lastAnalyticsIndex);
    updateLinkedFilterUi();
    updateLiveBadge(lastAnalyticsIndex);
  });

  const dashboardUrl = await resolveDashboardUrl();
  await wireDashboardFrame(dashboardUrl);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
