import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { calculateCompanyMetrics } from "../domain/calculateDashboardKpis.ts";
import type { CompanyKpiMonth } from "../domain/types.ts";
import { buildMetricExportRows } from "../lib/metricsExport.ts";

function month(overrides: Partial<CompanyKpiMonth> = {}): CompanyKpiMonth {
  return {
    year: 2025,
    month: 7,
    monthlyProfit: 155432.75,
    monthlyProfitSource: "epcc_email",
    quotesDone: 12345,
    ordersProcessed: 6789,
    salesInboxEnquiries: 4400,
    converted: 1100,
    mondaySyncMetadata: { sourceBoardId: "secret-board-123", fetchedAt: "2025-07-31T00:00:00Z" },
    notes: "internal audit note",
    source: "monday",
    ...overrides,
  };
}

function rows(current = month()) {
  const metrics = calculateCompanyMetrics(current, null, {});
  return buildMetricExportRows(current, metrics, { year: 2025, month: 7, view: "company", member: "selected-member" }, new Date("2026-07-24T00:00:00Z"));
}

test("dashboard export includes all six dashboard KPIs", () => {
  const output = rows();
  assert.deepEqual(output.map((row) => row.metric_name), [
    "Monthly Profit",
    "Quotes Done",
    "Orders Processed",
    "Sales Inbox Enquiries",
    "Conversion Rate",
    "Sales Inbox Conversion Rate",
  ]);

});

test("exports raw numbers instead of abbreviated display strings", () => {
  const output = rows();
  assert.equal(output.find((row) => row.metric_name === "Monthly Profit")?.raw_value, 155432.75);
  assert.equal(output.find((row) => row.metric_name === "Quotes Done")?.raw_value, 12345);
  assert.doesNotMatch(JSON.stringify(output), /155\.4K|12\.3K/);
});

test("exports a missing profit safely as null", () => {
  const output = rows(month({ monthlyProfit: null, monthlyProfitSource: null }));
  const profit = output.find((row) => row.metric_name === "Monthly Profit");
  assert.equal(profit?.raw_value, null);
  assert.equal(profit?.data_source, "monday");
});

test("includes the filtered period and final status without internal metadata", () => {
  const output = rows();
  assert.ok(output.every((row) => row.year === 2025 && row.month === 7));
  assert.ok(output.every((row) => row.status === "final"));
  const serialized = JSON.stringify(output);
  assert.doesNotMatch(serialized, /sourceBoardId|secret-board-123|fetchedAt|internal audit note|mondaySyncMetadata|notes/);
});

test("limits export columns to public KPI values and comparison context", () => {
  const [profit] = rows();
  assert.deepEqual(Object.keys(profit), [
    "year",
    "month",
    "view",
    "metric_name",
    "raw_value",
    "target",
    "prior_year_value",
    "data_source",
    "status",
  ]);
});

test("renders one dashboard export control and no per-card export controls", () => {
  const dashboard = readFileSync(new URL("../components/SalesDashboard.tsx", import.meta.url), "utf8");
  const button = readFileSync(new URL("../components/ExportMetricsButton.tsx", import.meta.url), "utf8");
  const buttonStyles = readFileSync(new URL("../components/ExportMetricsButton.module.css", import.meta.url), "utf8");
  const provider = readFileSync(new URL("../components/MetricDashboardProvider.tsx", import.meta.url), "utf8");
  const cards = ["ProfitShirtKpi.tsx", "SalesInboxKpi.tsx", "CombinedKpiCard.tsx"]
    .map((file) => readFileSync(new URL(`../components/${file}`, import.meta.url), "utf8"))
    .join("\n");

  assert.equal(dashboard.match(/<ExportMetricsButton /g)?.length, 1);
  assert.equal(button.match(/<ExportButton /g)?.length, 1);
  assert.equal(buttonStyles.match(/content: "Export Metrics"/g)?.length, 1);
  assert.doesNotMatch(provider, /\bexportable\b/);
  assert.doesNotMatch(cards, /CardShell|exportable|exportData|sales-kpi-export/);
});

test("MetricUI dropdown exposes image, CSV, and clipboard export", () => {
  const metricUi = readFileSync(new URL("../../../../node_modules/metricui/dist/index.js", import.meta.url), "utf8");
  assert.match(metricUi, /Save as image/);
  assert.match(metricUi, /Download CSV/);
  assert.match(metricUi, /Copy to clipboard/);
  assert.match(metricUi, /import\('modern-screenshot'\)/);
});

test("MetricUI image export targets the visible dashboard metrics wrapper", () => {
  const dashboard = readFileSync(new URL("../components/SalesDashboard.tsx", import.meta.url), "utf8");
  const button = readFileSync(new URL("../components/ExportMetricsButton.tsx", import.meta.url), "utf8");
  const buttonStyles = readFileSync(new URL("../components/ExportMetricsButton.module.css", import.meta.url), "utf8");
  assert.match(dashboard, /const dashboardMetricsRef = useRef<HTMLDivElement>\(null\)/);
  assert.match(dashboard, /<div ref=\{dashboardMetricsRef\} data-testid="sales-dashboard-export-content"/);
  assert.match(dashboard, /targetRef=\{dashboardMetricsRef\}/);
  assert.match(button, /<ExportButton title=\{title\} targetRef=\{targetRef\} data=\{rows\}/);
  assert.match(dashboard, /Pins Sales Metrics — \$\{DASHBOARD_MONTHS\[month - 1\]\} \$\{year\} —/);
  assert.match(button, /data-testid="sales-dashboard-export-control"/);
  assert.match(buttonStyles, /min-width:\s*9\.75rem/);
});

test("image capture excludes filter options and the export toolbar", () => {
  const dashboard = readFileSync(new URL("../components/SalesDashboard.tsx", import.meta.url), "utf8");
  const filterPanel = dashboard.indexOf('<form data-testid="sales-dashboard-filter-form"');
  const exportControl = dashboard.indexOf("<ExportMetricsButton");
  const filterPanelEnd = dashboard.indexOf("</div></Panel>", filterPanel);
  const captureTarget = dashboard.indexOf('<div ref={dashboardMetricsRef} data-testid="sales-dashboard-export-content"');
  const tabs = dashboard.indexOf("<DashboardNav", captureTarget);
  const metrics = dashboard.indexOf("<CompanyKpiView", captureTarget);

  assert.ok(filterPanel >= 0 && exportControl > filterPanel);
  assert.ok(filterPanelEnd > exportControl && captureTarget > filterPanelEnd);
  assert.ok(tabs > captureTarget && metrics > tabs);
  assert.doesNotMatch(dashboard.slice(captureTarget), /sales-dashboard-filter-form|<ExportMetricsButton|<ManualKpiEntry/);
});

test("export trigger stays mounted with a fixed footprint during export", () => {
  const button = readFileSync(new URL("../components/ExportMetricsButton.tsx", import.meta.url), "utf8");
  const styles = readFileSync(new URL("../components/ExportMetricsButton.module.css", import.meta.url), "utf8");
  assert.match(button, /return <div className=\{styles\.control\}[\s\S]*<ExportButton/);
  assert.doesNotMatch(button, /exporting\s*\?|isExporting|hidden|setState|useState/);
  assert.match(styles, /width:\s*9\.75rem/);
  assert.match(styles, /height:\s*2\.25rem/);
  assert.match(styles, /opacity:\s*1/);
  assert.match(styles, /white-space:\s*nowrap/);
  assert.match(styles, /display:\s*inline-flex/);
  assert.match(styles, /gap:\s*0\.5rem/);
  assert.doesNotMatch(styles, /display:\s*none|visibility:\s*hidden|opacity:\s*0(?:\D|$)/);
});

test("export dropdown is outside the filter form and cannot submit it", () => {
  const dashboard = readFileSync(new URL("../components/SalesDashboard.tsx", import.meta.url), "utf8");
  const metricUi = readFileSync(new URL("../../../../node_modules/metricui/dist/index.js", import.meta.url), "utf8");
  const formStart = dashboard.indexOf('<form data-testid="sales-dashboard-filter-form"');
  const formEnd = dashboard.indexOf("</form>", formStart);
  const actionsStart = dashboard.indexOf('<div data-testid="sales-dashboard-actions"');
  const filterForm = dashboard.slice(formStart, formEnd);

  assert.ok(formStart >= 0 && formEnd > formStart);
  assert.ok(actionsStart > formEnd);
  assert.equal(filterForm.match(/<button /g)?.length, 1);
  assert.match(filterForm, /<button[^>]*type="submit">Apply<\/button>/);
  assert.doesNotMatch(filterForm, /ExportMetricsButton|ManualKpiEntry/);
  assert.match(dashboard.slice(actionsStart), /<ManualKpiEntry[\s\S]*<ExportMetricsButton/);

  assert.match(metricUi, /createPortal\(/);
  for (const option of ["Save as image", "Download CSV", "Copy to clipboard"]) assert.match(metricUi, new RegExp(option));
});

test("buildMetricExportRows is pure and returns plain serializable data", () => {
  const current = month();
  const metrics = calculateCompanyMetrics(current, null, {});
  const filters = { year: 2025, month: 7, view: "company" as const };
  const now = new Date("2026-07-24T00:00:00Z");
  const first = buildMetricExportRows(current, metrics, filters, now);
  const second = buildMetricExportRows(current, metrics, filters, now);

  assert.deepEqual(first, second);
  assert.notStrictEqual(first, second);
  assert.deepEqual(structuredClone(first), first);
  assert.ok(first.every((row) => Object.getPrototypeOf(row) === Object.prototype));

  const moduleSource = readFileSync(new URL("../lib/metricsExport.ts", import.meta.url), "utf8");
  assert.match(moduleSource, /export function buildMetricExportRows/);
  assert.doesNotMatch(moduleSource, /use[A-Z]|router|fetch\(|setState|set[A-Z][A-Za-z]+\(/);
});

test("SalesDashboard memoizes the single export payload without navigation effects", () => {
  const component = readFileSync(new URL("../components/SalesDashboard.tsx", import.meta.url), "utf8");
  assert.match(component, /const exportRows = useMemo\(\(\) => buildMetricExportRows\(/);
  assert.doesNotMatch(component, /useEffect|router\.(?:push|replace|refresh)|history\.replaceState|syncUrl=/);

  const manualEntry = readFileSync(new URL("../components/ManualKpiEntry.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(manualEntry, /router\.refresh|useRouter/);
});
