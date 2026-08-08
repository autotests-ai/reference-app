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

/**
 * Awesome plugin charts.
 * Locked 2×2 (indices 0–3):
 *   [0] currentStatus     [1] durationDynamics
 *   [2] testingPyramid    [3] durations (groupBy: layer)
 */
export function buildAwesomeCharts() {
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
    charts.testResultSeverities({ title: TITLES.testResultSeverities }),
    charts.statusDynamics({ title: TITLES.statusDynamics, limit: 20 }),
    charts.statusTransitions({ title: TITLES.statusTransitions, limit: 20 }),
    charts.testBaseGrowthDynamics({
      title: TITLES.testBaseGrowthDynamics,
      limit: 20,
    }),
    charts.coverageDiff({ title: TITLES.coverageDiff }),
    charts.successRateDistribution({ title: TITLES.successRateDistribution }),
    charts.problemsDistribution({ title: TITLES.problemsByEnvironment }),
    charts.stabilityDistribution({
      title: TITLES.stabilityByComponent,
      threshold: STABILITY_THRESHOLD,
      stabilizationPeriod: STABILITY_STABILIZATION_PERIOD,
      skipStatuses: [...STABILITY_SKIP_STATUSES],
      groupBy: "label-name:component",
    }),
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
    charts.durations({ title: TITLES.durations, groupBy: "none" }),
    charts.statusAgePyramid({ title: TITLES.statusAgePyramid, limit: 20 }),
  ];
}
