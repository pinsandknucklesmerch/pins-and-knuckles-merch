import type { CompanyKpiMonth, MetricResult, SalesKpiDataSource } from "../domain/types";

export type DashboardExportFilters = {
  year: number;
  month: number;
  view: "company" | "members";
  member?: string;
};

export type MetricExportRow = {
  year: number;
  month: number;
  view: DashboardExportFilters["view"];
  metric_name: string;
  raw_value: number | null;
  target: number | null;
  prior_year_value: number | null;
  data_source: SalesKpiDataSource;
  status: "final" | "non-final";
};

function statusForPeriod(year: number, month: number, now: Date): MetricExportRow["status"] {
  const currentPeriod = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1);
  return Date.UTC(year, month - 1, 1) < currentPeriod ? "final" : "non-final";
}

function sourceForMetric(current: CompanyKpiMonth, metric: MetricResult): SalesKpiDataSource {
  return metric.code === "MONTHLY_PROFIT"
    ? current.monthlyProfitSource ?? current.source
    : current.source;
}

export function buildMetricExportRows(
  current: CompanyKpiMonth,
  metrics: MetricResult[],
  filters: DashboardExportFilters,
  now = new Date(),
): MetricExportRow[] {
  return metrics.map((metric) => ({
    year: current.year,
    month: current.month,
    view: filters.view,
    metric_name: metric.label,
    raw_value: metric.value,
    target: metric.target,
    prior_year_value: metric.previousYear,
    data_source: sourceForMetric(current, metric),
    status: statusForPeriod(current.year, current.month, now),
  }));
}

function escapeCsv(value: string | number | null) {
  if (value === null) return "";
  const text = String(value);
  return /[",\n\r]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function buildMetricExportCsv(rows: MetricExportRow[]) {
  if (rows.length === 0) return "";
  const columns = Object.keys(rows[0]) as Array<keyof MetricExportRow>;
  return [columns, ...rows.map((row) => columns.map((column) => row[column]))]
    .map((row) => row.map(escapeCsv).join(","))
    .join("\r\n");
}

export function getMetricExportFilename(year: number, month: number) {
  return `pins-sales-metrics-${year}-${String(month).padStart(2, "0")}.csv`;
}
