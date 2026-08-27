import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { calculateCompanyMetrics } from "../domain/calculateDashboardKpis.ts";
import type { CompanyKpiMonth } from "../domain/types.ts";
import { parseDashboardPeriod } from "../lib/dashboardPeriod.ts";
import { buildMetricExportRows } from "../lib/metricsExport.ts";
import { normalizeExportColors, shirtExportScale, shirtExportTransform } from "../lib/exportSafeColors.ts";

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
  return buildMetricExportRows(current, metrics, { year: 2025, month: 7 }, new Date("2026-07-24T00:00:00Z"));
}

test("shared dashboard period parsing accepts only valid report periods", () => {
  const now = new Date("2026-08-27T10:00:00Z");
  assert.deepEqual(parseDashboardPeriod({ year: "2025", month: "7" }, now), { year: 2025, month: 7 });
  assert.deepEqual(parseDashboardPeriod({ year: "2019", month: "13" }, now), { year: 2026, month: 8 });
});

test("dashboard export includes all seven dashboard KPIs", () => {
  const output = rows();
  assert.deepEqual(output.map((row) => row.metric_name), [
    "Monthly Profit",
    "Quotes Done",
    "Orders Processed",
    "PK Tax",
    "Active Marketing Enquiries",
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

test("retains shared export components while Sales Dashboard exposes no duplicate export controls", () => {
  const dashboard = readFileSync(new URL("../components/SalesDashboard.tsx", import.meta.url), "utf8");
  const button = readFileSync(new URL("../components/ExportMetricsButton.tsx", import.meta.url), "utf8");
  const buttonStyles = readFileSync(new URL("../components/ExportMetricsButton.module.css", import.meta.url), "utf8");
  const profitButton = readFileSync(new URL("../components/ProfitPdfExportButton.tsx", import.meta.url), "utf8");
  const provider = readFileSync(new URL("../components/MetricDashboardProvider.tsx", import.meta.url), "utf8");
  const cards = ["ProfitShirtKpi.tsx", "SalesInboxKpi.tsx", "CombinedKpiCard.tsx"]
    .map((file) => readFileSync(new URL(`../components/${file}`, import.meta.url), "utf8"))
    .join("\n");

  assert.equal(dashboard.match(/<ExportMetricsButton/g)?.length ?? 0, 0);
  assert.equal(button.match(/<ExportButton/g)?.length, 1);
  assert.equal(buttonStyles.match(/content: "Export Metrics"/g)?.length, 1);
  assert.doesNotMatch(button, /ProfitPdfExportButton/);
  assert.match(profitButton, /\[data-profit-pdf-page\]/);
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

test("MetricUI image export remains available in the dedicated Reporting workspace", () => {
  const button = readFileSync(new URL("../components/ExportMetricsButton.tsx", import.meta.url), "utf8");
  const buttonStyles = readFileSync(new URL("../components/ExportMetricsButton.module.css", import.meta.url), "utf8");
  const workspace = readFileSync(new URL("../components/MetricExportWorkspace.tsx", import.meta.url), "utf8");
  assert.match(workspace, /<ExportMetricsButton[\s\S]*targetRef=\{exportTargetRef\}/);
  assert.match(button, /<ExportButton[\s\S]*title=\{title\}[\s\S]*targetRef=\{targetRef\}[\s\S]*data=\{rows\}/);
  assert.match(workspace, /Pins Sales Metrics — \$\{DASHBOARD_MONTHS\[month - 1\]\} \$\{year\}/);
  assert.match(button, /data-testid="sales-dashboard-export-control"/);
  assert.match(buttonStyles, /min-width:\s*10\.5rem/);
});

test("image capture excludes filter options and the export toolbar", () => {
  const dashboard = readFileSync(new URL("../components/SalesDashboard.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(dashboard, /<ExportMetricsButton|ProfitPdfExportButton|dashboardMetricsRef|profitReportRef/);
});

test("EPCC PDF trigger stays mounted with a fixed footprint during export", () => {
  const button = readFileSync(new URL("../components/ExportMetricsButton.tsx", import.meta.url), "utf8");
  const profitButton = readFileSync(new URL("../components/ProfitPdfExportButton.tsx", import.meta.url), "utf8");
  const styles = readFileSync(new URL("../components/ProfitPdfExportButton.module.css", import.meta.url), "utf8");
  assert.match(button, /data-testid="sales-dashboard-export-control"/);
  assert.match(button, /<ExportButton/);
  assert.match(profitButton, /isExporting/);
  assert.match(styles, /width:\s*10\.5rem/);
  assert.match(styles, /height:\s*2\.25rem/);
  assert.match(styles, /opacity:\s*0\.65/);
  assert.match(styles, /white-space:\s*nowrap/);
  assert.match(styles, /display:\s*inline-flex/);
  assert.match(styles, /gap:\s*0\.5rem/);
  assert.doesNotMatch(styles, /display:\s*none|visibility:\s*hidden|opacity:\s*0(?:;|\s*$)/);
});

test("export dropdown is outside the filter form and cannot submit it", () => {
  const dashboard = readFileSync(new URL("../components/SalesDashboard.tsx", import.meta.url), "utf8");
  const metricUi = readFileSync(new URL("../../../../node_modules/metricui/dist/index.js", import.meta.url), "utf8");
  const formStart = dashboard.indexOf('<form data-testid="sales-dashboard-filter-form"');
  const formEnd = dashboard.indexOf("</form>", formStart);
  const actionsStart = dashboard.indexOf('data-testid="sales-dashboard-actions"');
  const managementStart = dashboard.indexOf('data-testid="sales-dashboard-management-group"');
  const filterForm = dashboard.slice(formStart, formEnd);

  assert.ok(formStart >= 0 && formEnd > formStart);
  assert.ok(actionsStart > managementStart && managementStart > formEnd);
  assert.equal(filterForm.match(/<button /g)?.length, 1);
  assert.match(filterForm, /<button[^>]*type="submit">Apply<\/button>/);
  assert.doesNotMatch(filterForm, /ExportMetricsButton|ManualKpiEntry/);
  assert.match(dashboard.slice(managementStart, actionsStart), /<ManualKpiEntry[\s\S]*<MonthlyKpiFinals/);
  assert.match(dashboard.slice(actionsStart), /<ExportMetricsButton[\s\S]*<ActionButton onClick=\{enterTvMode\}>TV Mode/);

  assert.match(metricUi, /createPortal\(/);
  for (const option of ["Save as image", "Download CSV", "Copy to clipboard"]) assert.match(metricUi, new RegExp(option));
});

test("buildMetricExportRows is pure and returns plain serializable data", () => {
  const current = month();
  const metrics = calculateCompanyMetrics(current, null, {});
  const filters = { year: 2025, month: 7 };
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
  assert.doesNotMatch(component, /useEffect|router\.(?:replace|refresh)|history\.replaceState|syncUrl=/);

  const manualEntry = readFileSync(new URL("../components/ManualKpiEntry.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(manualEntry, /router\.refresh|useRouter/);
});

test("EPCC PDF export normalizes modern MetricUI colors only in html2canvas clones", () => {
  const button = readFileSync(new URL("../components/ProfitPdfExportButton.tsx", import.meta.url), "utf8");
  const colors = readFileSync(new URL("../lib/exportSafeColors.ts", import.meta.url), "utf8");
  const report = readFileSync(new URL("../components/ProfitPdfReport.tsx", import.meta.url), "utf8");

  assert.match(button, /onclone:\s*\(clonedDocument, clonedElement\)/);
  assert.match(button, /normalizeExportColors\(clonedElement \?\? clonedDocument\.body\)/);
  assert.match(button, /removeContainer:\s*true/);
  assert.match(colors, /oklab\|oklch/);
  for (const token of ["#de3b43", "#e1ddba", "#333333", "#3c7aa3"]) assert.match(colors, new RegExp(token.replace("#", "\\#")));
  for (const property of ["color", "background-color", "border-color", "box-shadow", "text-shadow", "outline-color", "fill", "stroke"]) assert.match(colors, new RegExp(property));
  assert.match(report, /data-export-subtree="epcc-profit"/);
});

test("EPCC report keeps the requested profit and performance comparisons without duplicate report pages", () => {
  const report = readFileSync(new URL("../components/ProfitPdfReport.tsx", import.meta.url), "utf8");
  const monthly = readFileSync(new URL("../components/ProfitReportMonthlyProfit.tsx", import.meta.url), "utf8");
  const ytd = readFileSync(new URL("../components/ProfitReportYearToDate.tsx", import.meta.url), "utf8");
  const reportStyles = readFileSync(new URL("../components/ProfitPdfReport.module.css", import.meta.url), "utf8");

  assert.equal(report.match(/data-profit-pdf-page="true"/g)?.length, 2);
  assert.ok(report.indexOf('title="Company Profit"') < report.indexOf('title="Year to Date"'));
  assert.match(report, /<ProfitReportMonthlyProfit key=\{component\.id\} metric=\{monthlyProfitMetric\} label=\{component\.label\} bonusLabel=\{component\.labels\?\.bonus\} \/>/);
  assert.doesNotMatch(report, /<ProfitReportYtdSummary[\s\S]*reportMonth/);
  assert.match(report, /<ProfitReportYtdSummary key=\{component\.id\} data=\{yearToDate\} comparison=\{yearComparison\} label=\{component\.label\} \/>/);
  assert.match(report, /<ProfitReportMonthlyComparison data=\{yearToDate\} comparison=\{yearComparison\}/);
  assert.match(report, /<ProfitReportPerformanceKpis data=\{yearToDate\} comparison=\{yearComparison\}/);
  assert.doesNotMatch(report, /YearComparisonChart|ProfitReportCompanyProfit|ProfitReportYtdKpis/);
  assert.match(monthly, /companyProfitPresentation/);
  assert.match(monthly, /<MonthlyProfitTshirt/);
  assert.match(monthly, /target=\{presentation\.target\}/);
  assert.match(monthly, /tvMode/);
  assert.doesNotMatch(monthly, /<CompanyProfitGauge/);
  assert.match(monthly, /<strong>\{currency\(presentation\.current, 2\)\}<\/strong>/);
  for (const label of ["Monthly Profit", "Bonus Profit"]) assert.match(monthly, new RegExp(label));
  assert.match(monthly, /calculateBonusProfit/);
  assert.match(monthly, /styles\.bonusProfitValue/);
  assert.match(monthly, /currency\(bonusProfit, 2\)/);
  assert.match(monthly, /bonusProfit !== null && bonusProfit > 0 \? styles\.positive/);
  assert.match(reportStyles, /\.monthlySummary \.bonusProfitValue/);
  assert.match(reportStyles, /\.monthlySummary \.positive/);
  for (const label of ["YTD Target", "Above target", "Monthly Profit"]) assert.match(ytd, new RegExp(label));
  assert.doesNotMatch(ytd, /Bonus Profit/);
  assert.match(ytd, /data\.ytdTarget/);
  assert.match(ytd, /data\.variance/);
  assert.match(ytd, /\+" : "-"/);
  for (const code of ["SALES_INBOX_ENQUIRIES", "CONVERSION_RATE"]) assert.match(ytd, new RegExp(code));
  for (const code of ["ORDERS_PROCESSED", "QUOTES_DONE", "CONVERTED", "SALES_INBOX_CONVERSION_RATE"]) assert.doesNotMatch(ytd, new RegExp(code));
  assert.match(ytd, /ytdChartPoints/);
  assert.match(ytd, /ytdComparisonValue/);
  assert.match(ytd, /YtdProfitAreaChart/);
  assert.match(ytd, /YtdBarComparisonChart/);
  assert.match(ytd, /YtdRateComparisonChart/);
  assert.match(reportStyles, /companyProfit/);
  assert.match(reportStyles, /yearToDate/);
  assert.match(reportStyles, /yearToDatePrimary/);
  assert.match(reportStyles, /performanceKpis/);
});

test("EPCC PDF export cleans up after success or failure and emits a non-empty image", () => {
  const button = readFileSync(new URL("../components/ProfitPdfExportButton.tsx", import.meta.url), "utf8");
  assert.match(button, /finally\s*\{[\s\S]*setIsExporting\(false\)/);
  assert.match(button, /canvas\.toDataURL\("image\/png"\)/);
  assert.match(button, /pdf\.save\(profitFilename\)/);
  assert.match(button, /feedback\.error\("Could not download the profit PDF\."\)/);
});

test("Reporting EPCC workspace reuses the dashboard data, calculations, report subtree, and PDF action", () => {
  const page = readFileSync(new URL("../../../app/(hub)/hub/reporting/epcc/page.tsx", import.meta.url), "utf8");
  const dashboardPage = readFileSync(new URL("../../../app/(hub)/hub/sales-dashboard/page.tsx", import.meta.url), "utf8");
  const workspace = readFileSync(new URL("../components/EpccReportWorkspace.tsx", import.meta.url), "utf8");

  assert.match(page, /loadSalesDashboard\(year, month, access\.membership\?\.organisation_id \?\? null\)/);
  assert.match(page, /<EpccReportWorkspace data=\{data\} year=\{year\} month=\{month\} \/>/);
  assert.match(page, /parseDashboardPeriod\(params\)/);
  assert.match(dashboardPage, /parseDashboardPeriod\(params, now\)/);
  assert.match(workspace, /calculateCompanyMetrics\(data\.company, data\.previousCompany, data\.targets\)/);
  assert.match(workspace, /<ProfitPdfReport[\s\S]*year=\{year\}[\s\S]*month=\{month\}/);
  assert.match(workspace, /<ProfitPdfExportButton[\s\S]*profitTargetRef=\{profitReportRef\}/);
  assert.match(workspace, /name="year"/);
  assert.match(workspace, /name="month"/);
});

test("export color normalization removes oklab/oklch values and applies the safe palette", () => {
  const values: Record<string, string> = {
    color: "color-mix(in oklab, white 70%, transparent)",
    "background-color": "oklch(20% 0 0)",
    "border-color": "color-mix(in oklab, red 20%, transparent)",
    "box-shadow": "0 0 8px oklab(50% 0 0)",
  };
  const normalized: Record<string, string> = {};
  const element = {
    tagName: "DIV",
    className: "report-card",
    getAttribute: () => null,
    querySelectorAll: () => [],
    ownerDocument: {
      defaultView: { getComputedStyle: () => ({ getPropertyValue: (property: string) => values[property] ?? "" }) },
    },
    style: { setProperty: (property: string, value: string) => { normalized[property] = value; values[property] = value; } },
  } as unknown as Element;

  normalizeExportColors(element);
  assert.doesNotMatch(Object.values(normalized).join(" "), /oklab|oklch/);
  assert.equal(normalized.color, "#e1ddba");
  assert.equal(normalized["background-color"], "#333333");
  assert.equal(normalized["border-color"], "rgba(225, 221, 186, 0.2)");
  assert.equal(normalized["box-shadow"], "none");
});

test("shirt export preserves 0%, 1.6%, 50%, and 100% progress geometry", () => {
  assert.equal(shirtExportScale(0), 0);
  assert.equal(shirtExportTransform(0), "scaleY(0)");
  assert.equal(shirtExportScale(0.016), 0.016);
  assert.equal(shirtExportTransform(0.016), "scaleY(0.016)");
  assert.equal(shirtExportScale(0.5), 0.5);
  assert.equal(shirtExportTransform(0.5), "scaleY(0.5)");
  assert.equal(shirtExportScale(1), 1);
  assert.equal(shirtExportTransform(1), "scaleY(1)");
  assert.equal(shirtExportScale(2), 1);
});
