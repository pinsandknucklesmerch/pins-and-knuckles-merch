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
  _filters: DashboardExportFilters,
  now = new Date(),
): MetricExportRow[] {
  return metrics.map((metric) => ({
    year: current.year,
    month: current.month,
    metric_name: metric.label,
    raw_value: metric.value,
    target: metric.target,
    prior_year_value: metric.previousYear,
    data_source: sourceForMetric(current, metric),
    status: statusForPeriod(current.year, current.month, now),
  }));
}
