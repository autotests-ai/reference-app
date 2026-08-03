import fs from "node:fs";
import path from "node:path";

import { applyDashboardTheme } from "../apply-dashboard-theme.mjs";

/**
 * Intermediate Allure 3 plugin — Palette A on HTML dashboard/awesome.
 * Runs after generate (done hook), before notifications publish pass.
 * Palette + rounded-tiers reshape (empty Allure funnel bands are zero-width).
 */
export default class DashboardThemePlugin {
  /** @param {{ waitMs?: number }} options */
  constructor(options = {}) {
    this.options = options;
  }

  done = async (context) => {
    const reportRoot = context.output;
    const waitMs = this.options.waitMs ?? 8000;

    await waitForReportHtml(reportRoot, waitMs);
    applyDashboardTheme({ reportRoot });
  };
}

async function waitForReportHtml(reportRoot, waitMs) {
  const marker = path.join(reportRoot, "awesome/index.html");
  const started = Date.now();
  while (Date.now() - started < waitMs) {
    if (fs.existsSync(marker)) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  throw new Error(
    `dashboard-theme: timeout waiting for ${marker} (${waitMs}ms)`,
  );
}
