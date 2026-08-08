import { charts, panels, presets } from "@qa-guru/allure-report-kit";

import {
  PYRAMID_LAYERS,
  QUALITY_GATE_LABELS,
  STABILITY_SKIP_STATUSES,
  STABILITY_STABILIZATION_PERIOD,
  STABILITY_THRESHOLD,
  TITLES,
} from "./constants.mjs";

const LOCKED_TITLES = {
  currentStatus: TITLES.currentStatus,
  durationDynamics: TITLES.durationDynamics,
  testingPyramid: TITLES.testingPyramid,
  durations: TITLES.durationsByLayer,
};

const LOCKED_RENDERERS = {
  currentStatus: "stock",
  durationDynamics: "stock",
  durations: "stock",
};

/** Filter tests by Allure `component` label (hub README dashboard crops). */
export function componentLabelFilter(component) {
  return ({ labels }) =>
    labels.some(({ name, value }) => name === "component" && value === component);
}

/**
 * Compact 2×2 dashboard for README PNG — same locked quad as main layout.
 * Per-widget filter — no sibling components (webdriver vs playwright).
 */
export function buildComponentReadmeDashboardLayout(component) {
  const filter = componentLabelFilter(component);

  return presets.lockedQuad({
    layers: [...PYRAMID_LAYERS],
    titles: LOCKED_TITLES,
    limit: 20,
    renderers: LOCKED_RENDERERS,
    filter,
  });
}

/**
 * Dashboard plugin layout.
 * Locked 2×2 (indices 0–3):
 *   [0] currentStatus     [1] durationDynamics
 *   [2] testingPyramid    [3] durations (groupBy: layer)
 */
export function buildDashboardLayout({ epicCharts = [] } = {}) {
  const epicStatusDynamics = epicCharts.map((epic) =>
    charts.statusDynamics({
      title: `Динамика — ${epic}`,
      limit: 20,
      filter: ({ labels }) =>
        labels.some(({ name, value }) => name === "epic" && value === epic),
    }),
  );

  return [
    ...presets.lockedQuad({
      layers: [...PYRAMID_LAYERS],
      titles: LOCKED_TITLES,
      limit: 20,
      renderers: LOCKED_RENDERERS,
    }),
    panels.qualityGate({
      id: "qualityGate",
      title: TITLES.qualityGate,
      layout: "4x1",
      labels: QUALITY_GATE_LABELS,
    }),
    charts.statusDynamics({ title: TITLES.statusDynamics, limit: 20 }),
    charts.successRateDistribution({ title: TITLES.successRateDistribution }),
    charts.stabilityDistribution({
      title: TITLES.stabilityByComponent,
      threshold: STABILITY_THRESHOLD,
      stabilizationPeriod: STABILITY_STABILIZATION_PERIOD,
      skipStatuses: [...STABILITY_SKIP_STATUSES],
      groupBy: "label-name:component",
    }),
    charts.coverageDiff({ title: TITLES.coverageDiff }),
    charts.statusTransitions({ title: TITLES.statusTransitions, limit: 20 }),
    charts.testBaseGrowthDynamics({
      title: TITLES.testBaseGrowthDynamics,
      limit: 20,
    }),
    charts.problemsDistribution({ title: TITLES.problemsByEnvironment }),
    charts.stabilityDistribution({
      title: TITLES.stabilityByFeature,
      threshold: STABILITY_THRESHOLD,
      stabilizationPeriod: STABILITY_STABILIZATION_PERIOD,
      skipStatuses: [...STABILITY_SKIP_STATUSES],
      groupBy: "feature",
    }),
    charts.stabilityDistribution({
      title: TITLES.stabilityByEpic,
      threshold: STABILITY_THRESHOLD,
      stabilizationPeriod: STABILITY_STABILIZATION_PERIOD,
      skipStatuses: [...STABILITY_SKIP_STATUSES],
      groupBy: "epic",
    }),
    charts.stabilityDistribution({
      title: TITLES.stabilityByStory,
      threshold: STABILITY_THRESHOLD,
      stabilizationPeriod: STABILITY_STABILIZATION_PERIOD,
      skipStatuses: [...STABILITY_SKIP_STATUSES],
      groupBy: "story",
    }),
    charts.testResultSeverities({ title: TITLES.testResultSeverities }),
    charts.durations({ title: TITLES.durations, groupBy: "none" }),
    charts.statusAgePyramid({ title: TITLES.statusAgePyramid, limit: 20 }),
    ...epicStatusDynamics,
  ];
}
