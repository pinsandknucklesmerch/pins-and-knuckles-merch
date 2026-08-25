import { calculatePreviousDifference, calculatePreviousPercentageChange } from "../domain/calculateDashboardKpis";
import type { MetricResult, YearComparisonData, YearComparisonMetric, YearToDateData } from "../domain/types";
import { formatAnimatedMetricValue } from "../lib/animatedMetricValue";
import { comparisonBadgeDetails } from "../lib/comparisonBadge";
import { companyProfitPresentation } from "../lib/companyProfitPresentation";
import { previousYearComparisonState } from "../lib/metricDisplay";
import { ytdChartPoints } from "../lib/ytdPresentation";
import { sumYearComparisonMetric, ytdComparisonValue, type YtdComparisonMetric } from "../lib/ytdComparison";
import { YtdBarComparisonChart, YtdProfitAreaChart, YtdRateComparisonChart } from "./YtdComparisonCharts";
import styles from "./ProfitPdfReport.module.css";

type Definition = { code: Extract<YtdComparisonMetric, "ORDERS_PROCESSED" | "SALES_INBOX_ENQUIRIES" | "CONVERSION_RATE">; label: string; format: "number" | "percent"; chart: "bar" | "line" };

const PERFORMANCE_METRICS: Definition[] = [
  { code: "ORDERS_PROCESSED", label: "Orders Processed", format: "number", chart: "bar" },
  { code: "SALES_INBOX_ENQUIRIES", label: "Active Marketing Enquiries", format: "number", chart: "bar" },
  { code: "CONVERSION_RATE", label: "Conversion Rate", format: "percent", chart: "line" },
];

function format(value: number | null, kind: "currency" | "number" | "percent") {
  if (value === null || !Number.isFinite(value)) return "—";
  if (kind === "currency") return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(value);
  if (kind === "percent") return `${value.toFixed(1)}%`;
  return value.toLocaleString("en-GB", { maximumFractionDigits: 0 });
}

function Legend({ comparison }: { comparison: YearComparisonData }) {
  return <ul className={styles.legend} aria-label={`${comparison.selectedYear} current year and ${comparison.previousYear} previous year`}><li><i className={styles.currentSwatch} />{comparison.selectedYear}</li><li><i className={styles.previousSwatch} />{comparison.previousYear}</li></ul>;
}

function Comparison({ current, previous, format: kind, previousYear }: { current: number | null; previous: number | null; format: "currency" | "number" | "percent"; previousYear: number }) {
  const absoluteChange = calculatePreviousDifference(current, previous);
  const state = previousYearComparisonState(current, previous);
  const details = comparisonBadgeDetails({ absoluteChange: kind === "percent" ? null : absoluteChange, percentagePointChange: kind === "percent" ? absoluteChange : null, percentageChange: calculatePreviousPercentageChange(current, previous), absoluteFormat: kind === "currency" ? "currency" : "number", state });
  if (!details) return <span className={styles.comparisonUnavailable}>Previous-year value unavailable</span>;
  const values = details.values.map((value) => {
    const formatted = value.replace(" pts", "pp");
    if (!formatted.endsWith("%") || state === "neutral") return formatted;
    return `${state === "positive" ? "+" : "-"}${formatted}`;
  });
  return <span className={`${styles.comparison} ${styles[state]}`}>{values.join(" · ")} <em>vs {previousYear}</em></span>;
}

export function ProfitReportYtdSummary({ data, comparison, monthlyProfitMetric }: { data: YearToDateData; comparison: YearComparisonData; monthlyProfitMetric: MetricResult }) {
  const previousProfit = sumYearComparisonMetric(comparison.previous.filter((point) => point.month <= data.cutoffMonth), "MONTHLY_PROFIT");
  const monthlyProfit = companyProfitPresentation(monthlyProfitMetric).current;
  return <article className={styles.ytdProfitCard}>
    <p className={styles.kicker}>YTD Profit</p>
    <strong>{format(data.ytdActual, "currency")}</strong>
    <Comparison current={data.ytdActual} previous={previousProfit} format="currency" previousYear={comparison.previousYear} />
    <div className={styles.ytdMonthlyProfit}><span>Monthly Profit</span><strong>{formatAnimatedMetricValue(monthlyProfit, "currency", 2, 2)}</strong></div>
  </article>;
}

export function ProfitReportMonthlyComparison({ data, comparison }: { data: YearToDateData; comparison: YearComparisonData }) {
  const points = ytdChartPoints(comparison, data.cutoffMonth, "MONTHLY_PROFIT");
  return <article className={styles.profitChartCard}><header><div><h2>Monthly Profit Comparison</h2><span>{comparison.selectedYear} vs {comparison.previousYear}</span></div><Legend comparison={comparison} /></header><div className={styles.profitChart}><YtdProfitAreaChart points={points} label={`Monthly Profit, ${comparison.selectedYear} compared with ${comparison.previousYear}, January through December`} /></div></article>;
}

export function ProfitReportPerformanceKpis({ data, comparison }: { data: YearToDateData; comparison: YearComparisonData }) {
  const currentPoints = comparison.selected.filter((point) => point.month <= data.cutoffMonth);
  const previousPoints = comparison.previous.filter((point) => point.month <= data.cutoffMonth);
  return <div className={styles.performanceKpis}>{PERFORMANCE_METRICS.map((definition) => {
    const current = ytdComparisonValue(currentPoints, definition.code);
    const previous = ytdComparisonValue(previousPoints, definition.code);
    const points = ytdChartPoints(comparison, data.cutoffMonth, definition.code as YearComparisonMetric);
    const chart = definition.chart === "bar" ? <YtdBarComparisonChart points={points} format="number" label={`${definition.label}, monthly ${comparison.selectedYear} compared with ${comparison.previousYear}`} /> : <YtdRateComparisonChart points={points} label={`${definition.label}, monthly ${comparison.selectedYear} compared with ${comparison.previousYear}`} />;
    return <article className={styles.ytdKpi} key={definition.code}><header><div><h2>{definition.label}</h2><strong>{format(current, definition.format)}</strong><Comparison current={current} previous={previous} format={definition.format} previousYear={comparison.previousYear} /></div><Legend comparison={comparison} /></header><div className={styles.kpiChart}>{chart}</div></article>;
  })}</div>;
}
