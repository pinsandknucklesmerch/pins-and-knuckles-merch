import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { parseDashboardView } from "../lib/dashboardView.ts";

test("dashboard view query parsing is stable", () => {
  assert.equal(parseDashboardView("year-comparison"), "year-comparison");
  assert.equal(parseDashboardView("overview"), "overview");
  assert.equal(parseDashboardView(undefined), "overview");
  assert.equal(parseDashboardView("invalid"), "overview");
});

test("Sales Dashboard does not automatically navigate or rewrite its URL", () => {
  const dashboard = readFileSync(new URL("../components/SalesDashboard.tsx", import.meta.url), "utf8");
  const provider = readFileSync(new URL("../components/MetricDashboardProvider.tsx", import.meta.url), "utf8");
  const manualEntry = readFileSync(new URL("../components/ManualKpiEntry.tsx", import.meta.url), "utf8");
  const sources = [dashboard, provider, manualEntry].join("\n");

  assert.doesNotMatch(dashboard, /syncUrl=|window\.location|useEffect/);
  assert.doesNotMatch(sources, /router\.(?:refresh|replace|push)\(|history\.(?:replaceState|pushState)\(|requestSubmit\(|\.submit\(|setInterval\(/);
  assert.match(dashboard, /currentView === nextView \? currentView : nextView/);
  assert.match(manualEntry, /open \? <ManualKpiForm/);
  assert.match(manualEntry, /function ManualKpiForm[\s\S]*useActionState/);
});

test("server query state initializes the dashboard without a mount reconciliation effect", () => {
  const page = readFileSync(new URL("../../../app/(hub)/hub/sales-dashboard/page.tsx", import.meta.url), "utf8");
  assert.match(page, /parseDashboardView\(first\(params\.dashboardView\)\)/);
  assert.match(page, /initialDashboardView=\{dashboardView\}/);
});
