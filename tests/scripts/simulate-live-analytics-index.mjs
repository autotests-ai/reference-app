#!/usr/bin/env node
/**
 * Simulate live analytics-index updates for allure-dashboard.html?live=1
 * Writes progressive snapshots from frontend/analytics-index.mock.json.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "../..");

const PASS_RATE_COLORS = {
  passed: "#16a34a",
  failed: "#dc2626",
  broken: "#d97706",
  skipped: "#64748b",
  unknown: "#64748b",
};

const TEST_LAYERS = [
  "e2e",
  "e2e",
  "e2e",
  "component",
  "unit",
  "unit",
  "unit",
  "unit",
  "e2e",
  "unit",
  "unit",
  "api",
  "integration",
  "component",
];

const STEPS = [
  { total: 0, passed: 0, failed: 0, broken: 0, skipped: 0, passRate: 0, avgDurationSec: 0 },
  { total: 2, passed: 2, failed: 0, broken: 0, skipped: 0, passRate: 1, avgDurationSec: 1.06 },
  { total: 5, passed: 3, failed: 1, broken: 0, skipped: 1, passRate: 0.6, avgDurationSec: 1.12 },
  { total: 8, passed: 5, failed: 2, broken: 0, skipped: 1, passRate: 0.625, avgDurationSec: 1.18 },
  { total: 10, passed: 6, failed: 2, broken: 1, skipped: 1, passRate: 0.6, avgDurationSec: 1.25 },
  { total: 12, passed: 7, failed: 2, broken: 1, skipped: 2, passRate: 0.583, avgDurationSec: 1.3 },
  { total: 14, passed: 8, failed: 3, broken: 1, skipped: 2, passRate: 0.571, avgDurationSec: 1.32 },
  { total: 14, passed: 8, failed: 3, broken: 1, skipped: 2, passRate: 0.571, avgDurationSec: 1.32 },
];

function parseArgs(argv) {
  const options = {
    mockFile: path.join(repoRoot, "frontend/analytics-index.mock.json"),
    outputFile: path.join(repoRoot, "tests-java/build/analytics-index.json"),
    steps: STEPS.length,
    intervalMs: 300,
    pollMs: 300,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (token === "--mock") options.mockFile = path.resolve(argv[++index] ?? options.mockFile);
    else if (token === "--output") options.outputFile = path.resolve(argv[++index] ?? options.outputFile);
    else if (token === "--steps") options.steps = Number(argv[++index] ?? options.steps);
    else if (token === "--interval") options.intervalMs = Number(argv[++index] ?? options.intervalMs);
    else if (token === "--poll") options.pollMs = Number(argv[++index] ?? options.pollMs);
  }
  return options;
}

function round(value, digits = 3) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function buildPassRate(summary) {
  return [
    { name: "Passed", y: summary.passed, status: "passed", color: PASS_RATE_COLORS.passed },
    { name: "Failed", y: summary.failed, status: "failed", color: PASS_RATE_COLORS.failed },
    { name: "Broken", y: summary.broken, status: "broken", color: PASS_RATE_COLORS.broken },
    { name: "Skipped", y: summary.skipped, status: "skipped", color: PASS_RATE_COLORS.skipped },
  ].filter((entry) => entry.y > 0);
}

function buildFailureTaxonomy(tests) {
  const counts = new Map();
  const colors = {
    Таймауты: "#dc2626",
    "Ошибки проверок": "#d97706",
    Сеть: "#64748b",
  };
  for (const test of tests) {
    if (!test.failureCategory || (test.status !== "failed" && test.status !== "broken")) continue;
    counts.set(test.failureCategory, (counts.get(test.failureCategory) ?? 0) + 1);
  }
  return [...counts.entries()].map(([name, y]) => ({
    name,
    y,
    color: colors[name] ?? "#64748b",
  }));
}

function buildTestingPyramid(tests) {
  const layers = ["unit", "component", "integration", "api", "e2e", "manual"];
  const buckets = Object.fromEntries(layers.map((layer) => [layer, { total: 0, passed: 0 }]));

  tests.forEach((test, index) => {
    const layer = TEST_LAYERS[index] ?? "unit";
    if (!buckets[layer]) return;
    buckets[layer].total += 1;
    if (test.status === "passed") buckets[layer].passed += 1;
  });

  const visibleTotal = tests.length || 1;
  return layers
    .map((layer) => {
      const bucket = buckets[layer];
      if (!bucket.total) return null;
      const successRate = Math.round((bucket.passed / bucket.total) * 100);
      return {
        layer,
        testCount: bucket.total,
        successRate,
        percentage: Math.round((bucket.total / visibleTotal) * 100),
      };
    })
    .filter(Boolean);
}

function buildDuration(stepIndex, avgDurationSec, templateDuration) {
  const pointCount = Math.max(1, stepIndex + 1);
  const categories = templateDuration.categories.slice(0, pointCount);
  const templateValues = templateDuration.valuesSec.slice(0, pointCount);
  const valuesSec = templateValues.map((value, index) => {
    if (index === pointCount - 1) return round(avgDurationSec || value, 2);
    return value;
  });
  if (!categories.length) {
    return { categories: ["R1"], valuesSec: [round(avgDurationSec, 2)] };
  }
  return { categories, valuesSec };
}

function clipTestHistory(test, stepIndex) {
  const historyLimit = Math.max(1, stepIndex);
  const history = (test.history ?? []).slice(0, Math.min(historyLimit, test.history?.length ?? 0));
  return { ...test, history };
}

function buildSnapshot(mock, stepIndex) {
  const step = STEPS[Math.min(stepIndex, STEPS.length - 1)];
  const isFinal = stepIndex >= STEPS.length - 1;
  const visibleTests = mock.tests.slice(0, step.total).map((test) => clipTestHistory(test, stepIndex + 1));

  const durationMs = visibleTests.reduce((sum, test) => sum + (test.durationMs ?? 0), 0);

  const summary = {
    total: step.total,
    passed: step.passed,
    failed: step.failed,
    broken: step.broken,
    skipped: step.skipped,
    unknown: 0,
    passRate: step.total ? round(step.passRate, 3) : 0,
    durationMs,
    avgDurationSec: round(step.avgDurationSec, 2),
  };

  const payload = {
    schema: mock.schema,
    generatedAt: new Date().toISOString(),
    runState: isFinal ? "complete" : "in_progress",
    sources: {
      ...mock.sources,
      allureResults: "simulate-live",
    },
    summary,
    charts: {
      passRate: buildPassRate(summary),
      duration: buildDuration(stepIndex, step.avgDurationSec, mock.charts.duration),
      failureTaxonomy: step.failed + step.broken > 0 ? buildFailureTaxonomy(visibleTests) : [],
      testingPyramid: buildTestingPyramid(visibleTests),
      epicBreakdown: isFinal ? (mock.charts.epicBreakdown ?? []) : [],
    },
    tests: visibleTests,
    historyRuns: mock.historyRuns.slice(0, Math.max(1, stepIndex + 1)),
    qualityGate: isFinal ? mock.qualityGate : null,
    agent: mock.agent,
  };

  if (payload.qualityGate) {
    payload.qualityGate = {
      ...payload.qualityGate,
      evaluatedAt: payload.generatedAt,
    };
  }

  return payload;
}

function writeSnapshot(outputFile, payload) {
  fs.mkdirSync(path.dirname(outputFile), { recursive: true });
  fs.writeFileSync(outputFile, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
}

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const mock = JSON.parse(fs.readFileSync(options.mockFile, "utf8"));
  const stepCount = Math.min(Math.max(1, options.steps), STEPS.length);
  const intervalMs =
    Number.isFinite(options.intervalMs) && options.intervalMs >= 100
      ? Math.round(options.intervalMs)
      : 300;
  const pollMs =
    Number.isFinite(options.pollMs) && options.pollMs >= 100
      ? Math.round(options.pollMs)
      : intervalMs;
  const dashboardUrl = `http://localhost:3000/allure-dashboard.html?live=1&poll=${pollMs}`;

  console.log(`simulate-live-analytics-index: ${stepCount} steps every ${intervalMs}ms`);
  console.log(`  mock  → ${options.mockFile}`);
  console.log(`  output → ${options.outputFile}`);
  console.log(`  open  → ${dashboardUrl}`);

  for (let stepIndex = 0; stepIndex < stepCount; stepIndex += 1) {
    const payload = buildSnapshot(mock, stepIndex);
    writeSnapshot(options.outputFile, payload);
    console.log(
      `[step ${stepIndex + 1}/${stepCount}] runState=${payload.runState} total=${payload.summary.total} generatedAt=${payload.generatedAt}`
    );
    if (stepIndex < stepCount - 1) {
      await sleep(intervalMs);
    }
  }

  console.log("simulate-live-analytics-index: done");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
