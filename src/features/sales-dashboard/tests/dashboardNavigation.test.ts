import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { parseDashboardView } from "../lib/dashboardView.ts";

test("dashboard view query parsing is stable", () => {
  assert.equal(parseDashboardView("year-comparison"), "year-comparison");
  assert.equal(parseDashboardView("ytd"), "ytd");
  assert.equal(parseDashboardView("overview"), "overview");
  assert.equal(parseDashboardView("team-members"), "team-members");
  assert.equal(parseDashboardView(undefined), "overview");
  assert.equal(parseDashboardView("invalid"), "overview");
});

test("Sales Dashboard does not automatically navigate or rewrite its URL", () => {
  const dashboard = readFileSync(new URL("../components/SalesDashboard.tsx", import.meta.url), "utf8");
  const provider = readFileSync(new URL("../components/MetricDashboardProvider.tsx", import.meta.url), "utf8");
  const manualEntry = readFileSync(new URL("../components/ManualKpiEntry.tsx", import.meta.url), "utf8");
  const sources = [dashboard, provider, manualEntry].join("\n");

  assert.doesNotMatch(dashboard, /syncUrl=|window\.location|useEffect|name="view"|name="member"/);
  assert.doesNotMatch(sources, /router\.(?:refresh|replace)\(|history\.(?:replaceState|pushState)\(|requestSubmit\(|\.submit\(|setInterval\(/);
  assert.match(dashboard, /currentView === nextView \? currentView : nextView/);
  assert.match(manualEntry, /open \? <ManualKpiForm/);
  assert.match(manualEntry, /function ManualKpiForm[\s\S]*useActionState/);
});

test("server query state initializes the dashboard without a mount reconciliation effect", () => {
  const page = readFileSync(new URL("../../../app/(hub)/hub/sales-dashboard/page.tsx", import.meta.url), "utf8");
  assert.match(page, /parseDashboardView\(first\(params\.dashboardView\)\)/);
  assert.match(page, /initialDashboardView=\{dashboardView\}/);
});

test("Sales Dashboard no longer carries the redundant Company/Team Member selector state", () => {
  const page = readFileSync(new URL("../../../app/(hub)/hub/sales-dashboard/page.tsx", import.meta.url), "utf8");
  const repository = readFileSync(new URL("../data/salesDashboardRepository.ts", import.meta.url), "utf8");
  assert.doesNotMatch(page, /params\.view|params\.member|(?:^|[?&])view=|(?:^|[?&])member=/);
  assert.doesNotMatch(repository, /getSalesDashboardQueryPlan|DashboardView/);
});

test("company dashboard keeps monthly content separate from year to date", () => {
  const dashboard = readFileSync(new URL("../components/SalesDashboard.tsx", import.meta.url), "utf8");
  const company = readFileSync(new URL("../components/CompanyKpiView.tsx", import.meta.url), "utf8");

  assert.match(dashboard, /\{ value: "overview", label: "Overview" \}/);
  assert.match(dashboard, /\{ value: "ytd", label: "YTD" \}/);
  assert.match(dashboard, /\{ value: "year-comparison", label: "Year Comparison" \}/);
  assert.match(dashboard, /\{ value: "team-members", label: "Team Members" \}/);
  assert.doesNotMatch(dashboard, /TeamMemberKpiView|<Select[^>]+name="view"|name="member"/);
  assert.match(dashboard, /useState<DashboardView>\(initialDashboardView\)/);
  assert.match(dashboard, /activeDashboardView === "overview"[\s\S]*<CompanyKpiView[\s\S]*activeDashboardView === "ytd"[\s\S]*<YearToDateView[\s\S]*<YearComparisonChart/);
  assert.match(dashboard, /sales-dashboard-actions" className="flex min-w-0 flex-wrap/);
  assert.match(dashboard, /isAdmin \? <MonthlyKpiFinals/);
  assert.doesNotMatch(company, /MonthlyKpiFinals/);
});
