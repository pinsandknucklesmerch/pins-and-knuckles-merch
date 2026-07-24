import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { calculateCompanyMetrics } from "../domain/calculateDashboardKpis.ts";
import type { CompanyKpiMonth } from "../domain/types.ts";
import { buildMetricExportCsv, buildMetricExportRows, getMetricExportFilename } from "../lib/metricsExport.ts";

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
  const provider = readFileSync(new URL("../components/MetricDashboardProvider.tsx", import.meta.url), "utf8");
  const cards = ["ProfitShirtKpi.tsx", "SalesInboxKpi.tsx", "CombinedKpiCard.tsx"]
    .map((file) => readFileSync(new URL(`../components/${file}`, import.meta.url), "utf8"))
    .join("\n");

  assert.match(dashboard, /<ExportMetricsButton rows=\{exportRows\}/);
  assert.equal(button.match(/Export Metrics/g)?.length, 1);
  assert.doesNotMatch(provider, /\bexportable\b/);
  assert.doesNotMatch(cards, /CardShell|exportable|exportData|sales-kpi-export/);
});

test("generates the selected-period filename", () => {
  assert.equal(getMetricExportFilename(2026, 7), "pins-sales-metrics-2026-07.csv");
});

test("builds CSV from raw public values", () => {
  const csv = buildMetricExportCsv(rows());
  assert.match(csv, /^year,month,view,metric_name,raw_value,target,prior_year_value,data_source,status\r\n/);
  assert.match(csv, /Monthly Profit,155432\.75,/);
  assert.doesNotMatch(csv, /155\.4K|sourceBoardId|secret-board-123|fetchedAt|internal audit note/);
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
  assert.doesNotMatch(component, /useEffect|router\.refresh|syncUrl=/);

  const manualEntry = readFileSync(new URL("../components/ManualKpiEntry.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(manualEntry, /router\.refresh|useRouter/);
});
