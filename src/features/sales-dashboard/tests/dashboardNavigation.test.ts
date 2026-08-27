import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { parseDashboardView } from "../lib/dashboardView.ts";

test("dashboard view query parsing is stable", () => {
  assert.equal(parseDashboardView("year-comparison"), "overview");
  assert.equal(parseDashboardView("company-profit"), "company-profit");
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
  assert.match(page, /<AppShell tvMode=\{tvMode\} wideContent>/);
  assert.doesNotMatch(page, /PageHeader/);
});

test("Sales Dashboard no longer carries the redundant Company/Team Member selector state", () => {
  const page = readFileSync(new URL("../../../app/(hub)/hub/sales-dashboard/page.tsx", import.meta.url), "utf8");
  const repository = readFileSync(new URL("../data/salesDashboardRepository.ts", import.meta.url), "utf8");
  assert.doesNotMatch(page, /params\.view|params\.member|(?:^|[?&])view=|(?:^|[?&])member=/);
  assert.doesNotMatch(repository, /getSalesDashboardQueryPlan|DashboardView/);
});

test("dashboard headline values come from the explicitly selected month", () => {
  const repository = readFileSync(new URL("../data/salesDashboardRepository.ts", import.meta.url), "utf8");

  assert.match(repository, /const companyPromise = [^\n]+\.in\("year", \[year, year - 1\]\)\.eq\("month", month\)/);
  assert.match(repository, /const companyRows = companyResult\.data \?\? \[\]/);
  assert.doesNotMatch(repository, /const companyRows = trendResult\.data/);
});

test("dashboard trend and available-year reads retain separate query bounds", () => {
  const repository = readFileSync(new URL("../data/salesDashboardRepository.ts", import.meta.url), "utf8");

  assert.match(repository, /const trendPromise = [^\n]+\.in\("year", \[year, year - 1\]\)/);
  assert.match(repository, /\.select\("year"\)\.or\(scope\)\.limit\(1000\)/);
  assert.match(repository, /const databaseYears = \(yearResult\.data \?\? \[\]\)\.map/);
});

test("company dashboard keeps monthly content separate from year to date", () => {
  const dashboard = readFileSync(new URL("../components/SalesDashboard.tsx", import.meta.url), "utf8");
  const company = readFileSync(new URL("../components/CompanyKpiView.tsx", import.meta.url), "utf8");
  const styles = readFileSync(new URL("../components/SalesDashboard.module.css", import.meta.url), "utf8");

  assert.match(dashboard, /\{ value: "overview", label: "Overview" \}/);
  assert.match(dashboard, /\{ value: "company-profit", label: "Company Profit" \}/);
  assert.match(dashboard, /\{ value: "ytd", label: "YTD" \}/);
  assert.doesNotMatch(dashboard, /\{ value: "year-comparison"|activeDashboardView === "year-comparison"|<YearComparisonChart/);
  assert.match(dashboard, /\{ value: "team-members", label: "Team Members" \}/);
  assert.doesNotMatch(dashboard, /TeamMemberKpiView|<Select[^>]+name="view"|name="member"/);
  assert.match(dashboard, /useState<DashboardView>\(initialDashboardView\)/);
  assert.match(dashboard, /activeDashboardView === "company-profit"[\s\S]*<CompanyProfitView[\s\S]*activeDashboardView === "ytd"[\s\S]*<YearToDateView[\s\S]*<CompanyKpiView/);
  assert.match(dashboard, /data-testid="sales-dashboard-actions"/);
  assert.match(dashboard, /<header className=\{styles\.dashboardHeader\}>[\s\S]*<h1>Sales Dashboard<\/h1>[\s\S]*<DashboardNav[\s\S]*<\/header>/);
  assert.match(dashboard, /const isOverviewView = activeDashboardView === "overview"/);
  assert.match(dashboard, /<\/header>[\s\S]*\{isOverviewView \? <Panel><div className=\{styles\.controlSurface\}>[\s\S]*<\/div><\/Panel> : null\}/);
  assert.doesNotMatch(dashboard, /\{isOverviewView \?[\s\S]*<DashboardNav/);
  assert.match(dashboard, /role="group" aria-labelledby="sales-dashboard-period-label"/);
  assert.match(dashboard, /role="group" aria-labelledby="sales-dashboard-management-label"/);
  assert.match(dashboard, /role="group" aria-labelledby="sales-dashboard-actions-label"/);
  assert.match(dashboard, />TV Mode<\/ActionButton>/);
  assert.match(dashboard, /isAdmin \? <MonthlyKpiFinals/);
  assert.doesNotMatch(company, /MonthlyKpiFinals/);
  assert.match(styles, /\.dashboardTabs \{[\s\S]*overflow-x: visible/);
  assert.match(styles, /@media \(max-width: 639px\) \{[\s\S]*\.dashboardTabs \{[\s\S]*overflow-x: auto[\s\S]*scrollbar-width: none/);
  assert.match(styles, /\.dashboardTabs::\-webkit-scrollbar \{[\s\S]*display: none/);
});
