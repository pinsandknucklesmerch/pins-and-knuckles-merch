"use client";

import type { CSSProperties } from "react";
import { BadgeCheck, ClipboardList, Mail, Percent, PoundSterling, ShoppingCart } from "lucide-react";
import { calculatePreviousDifference, calculatePreviousPercentageChange } from "../domain/calculateDashboardKpis";
import type { YearComparisonData, YearToDateData } from "../domain/types";
import { comparisonBadgeDetails } from "../lib/comparisonBadge";
import { previousYearComparisonState } from "../lib/metricDisplay";
import { sumYearComparisonMetric, ytdComparisonValue, type YtdComparisonMetric } from "../lib/ytdComparison";
import { ytdChartPoints } from "../lib/ytdPresentation";
import { AnimatedMetricValue } from "./AnimatedMetricValue";
import { YtdBarComparisonChart, YtdProfitAreaChart, YtdRateComparisonChart, type YtdChartFormat } from "./YtdComparisonCharts";
import styles from "./YearToDateView.module.css";

type MetricDefinition = {
  code: YtdComparisonMetric;
  label: string;
  format: Exclude<YtdChartFormat, "currency">;
  chart: "bar" | "line";
  icon: typeof ClipboardList;
  tone: "blue" | "green" | "purple" | "amber" | "cyan" | "violet";
};

const METRICS: MetricDefinition[] = [
  { code: "QUOTES_DONE", label: "Quotes Done", format: "number", chart: "bar", icon: ClipboardList, tone: "blue" },
  { code: "ORDERS_PROCESSED", label: "Orders Processed", format: "number", chart: "bar", icon: ShoppingCart, tone: "green" },
  { code: "CONVERTED", label: "Converted", format: "number", chart: "bar", icon: BadgeCheck, tone: "purple" },
  { code: "CONVERSION_RATE", label: "Conversion Rate", format: "percent", chart: "line", icon: Percent, tone: "amber" },
  { code: "SALES_INBOX_ENQUIRIES", label: "Active Marketing Enquiries", format: "number", chart: "bar", icon: Mail, tone: "cyan" },
  { code: "SALES_INBOX_CONVERSION_RATE", label: "Sales Inbox Conversion Rate", format: "percent", chart: "line", icon: Percent, tone: "violet" },
];

function formatValue(value: number | null, format: YtdChartFormat) {
  if (value === null || !Number.isFinite(value)) return "—";
  if (format === "percent") return `${value.toFixed(1)}%`;
  if (format === "currency") return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(value);
  return value.toLocaleString("en-GB", { maximumFractionDigits: 0 });
}

function ChartLegend({ selectedYear, previousYear }: { selectedYear: number; previousYear: number }) {
  return <ul className={styles.legend} aria-label={`${selectedYear} current year and ${previousYear} previous year`}>
    <li><span className={styles.currentSwatch} aria-hidden="true" />{selectedYear}</li>
    <li><span className={styles.previousSwatch} aria-hidden="true" />{previousYear}</li>
  </ul>;
}

function ComparisonLine({ current, previous, format }: { current: number | null; previous: number | null; format: YtdChartFormat }) {
  const absoluteChange = calculatePreviousDifference(current, previous);
  const percentageChange = calculatePreviousPercentageChange(current, previous);
  const state = previousYearComparisonState(current, previous);
  const details = comparisonBadgeDetails({
    absoluteChange: format === "percent" ? null : absoluteChange,
    percentagePointChange: format === "percent" ? absoluteChange : null,
    percentageChange,
    absoluteFormat: format === "currency" ? "currency" : "number",
    state,
  });
  if (!details) return <div className={styles.comparisonUnavailable}>Previous YTD unavailable</div>;
  const values = details.values.map((value) => value.replace(" pts", "pp"));
  return <div className={`${styles.comparisonLine} ${styles[state]}`} aria-label={details.accessibleLabel}>
    <span className={styles.comparisonValue}><span aria-hidden="true">{details.icon}</span> {values.join(" · ")}</span>
  </div>;
}

function YtdProfitSummary({ data, comparison, previousProfit }: { data: YearToDateData; comparison: YearComparisonData; previousProfit: number | null }) {
  const variance = data.variance === null ? null : Math.abs(data.variance);
  const varianceLabel = data.variance === null ? null : data.variance >= 0 ? "Above target" : "Below target";
  return <article className={styles.profitCard}>
    <div className={styles.metricTitle}><span className={`${styles.iconTile} ${styles.profitIcon}`}><PoundSterling aria-hidden="true" /></span><h3>YTD Profit</h3></div>
    <AnimatedMetricValue value={data.ytdActual} format="currency" maximumFractionDigits={0} className={styles.profitValue} />
    <ComparisonLine current={data.ytdActual} previous={previousProfit} format="currency" />
    <div className={styles.profitLower}>
      <div><span>{comparison.previousYear} YTD</span><strong>{formatValue(previousProfit, "currency")}</strong></div>
      <div><span>YTD Target</span><strong>{formatValue(data.ytdTarget, "currency")}</strong></div>
    </div>
    {varianceLabel && variance !== null ? <div className={`${styles.targetVariance} ${data.variance !== null && data.variance >= 0 ? styles.positive : styles.negative}`}>{varianceLabel} <strong>{formatValue(variance, "currency")}</strong></div> : null}
  </article>;
}

function YtdMonthlyProfitChart({ comparison, cutoffMonth }: { comparison: YearComparisonData; cutoffMonth: number }) {
  const points = ytdChartPoints(comparison, cutoffMonth, "MONTHLY_PROFIT");
  return <article className={styles.profitChartCard}>
    <header className={styles.chartHeader}><div><h3>Monthly Profit</h3><span>{comparison.selectedYear} vs {comparison.previousYear}</span></div><ChartLegend selectedYear={comparison.selectedYear} previousYear={comparison.previousYear} /></header>
    <div className={styles.profitChartFrame}><YtdProfitAreaChart points={points} label={`Monthly Profit, ${comparison.selectedYear} compared with ${comparison.previousYear}, January through December`} /></div>
  </article>;
}

function YtdComparisonCard({ comparison, cutoffMonth, definition }: { comparison: YearComparisonData; cutoffMonth: number; definition: MetricDefinition }) {
  const currentPeriod = comparison.selected.filter((point) => point.month <= cutoffMonth);
  const previousPeriod = comparison.previous.filter((point) => point.month <= cutoffMonth);
  const current = ytdComparisonValue(currentPeriod, definition.code);
  const previous = ytdComparisonValue(previousPeriod, definition.code);
  const points = ytdChartPoints(comparison, cutoffMonth, definition.code);
  const Icon = definition.icon;
  const chartLabel = `${definition.label}, monthly ${comparison.selectedYear} compared with ${comparison.previousYear}`;
  return <article className={styles.comparisonCard}>
    <div className={styles.cardSummary}>
      <div className={styles.metricTitle}><span className={styles.iconTile} data-tone={definition.tone}><Icon aria-hidden="true" /></span><h3>{definition.label}</h3></div>
      <AnimatedMetricValue value={current} format={definition.format} maximumFractionDigits={definition.format === "percent" ? 1 : 0} className={styles.cardValue} />
      <ComparisonLine current={current} previous={previous} format={definition.format} />
      <div className={styles.previousBlock}><span>{comparison.previousYear} YTD</span><strong>{formatValue(previous, definition.format)}</strong></div>
    </div>
    <div className={styles.cardChart}>
      <ChartLegend selectedYear={comparison.selectedYear} previousYear={comparison.previousYear} />
      <div className={styles.cardChartFrame}>{definition.chart === "bar"
        ? <YtdBarComparisonChart points={points} format="number" label={chartLabel} />
        : <YtdRateComparisonChart points={points} label={chartLabel} />}</div>
    </div>
  </article>;
}

export function YearToDateView({ data, comparison, showHeading = true, tvMode = false }: { data: YearToDateData; comparison: YearComparisonData; showHeading?: boolean; tvMode?: boolean }) {
  const previousProfit = sumYearComparisonMetric(comparison.previous.filter((point) => point.month <= data.cutoffMonth), "MONTHLY_PROFIT");
  return <section className={`${styles.panel} ${showHeading ? "" : styles.panelWithoutHeader}`} aria-labelledby={showHeading ? "year-to-date-title" : undefined} data-tv-view={tvMode ? "ytd" : undefined}>
    {showHeading ? <header className={styles.panelHeader} data-tv-group={tvMode ? "ytd-summary" : undefined} style={tvMode ? { "--tv-enter-index": 0 } as CSSProperties : undefined}>
      <div><h2 id="year-to-date-title">Year to Date</h2><span>{comparison.selectedYear} vs {comparison.previousYear}</span></div>
    </header> : null}
    <div className={styles.panelBody}>
      <div className={styles.heroGrid} data-tv-group={tvMode ? "ytd-primary" : undefined} style={tvMode ? { "--tv-enter-index": 1 } as CSSProperties : undefined}>
        <YtdProfitSummary data={data} comparison={comparison} previousProfit={previousProfit} />
        <YtdMonthlyProfitChart comparison={comparison} cutoffMonth={data.cutoffMonth} />
      </div>
      <div className={styles.comparisonGrid} data-tv-group={tvMode ? "ytd-metrics" : undefined} style={tvMode ? { "--tv-enter-index": 2 } as CSSProperties : undefined}>
        {METRICS.map((definition) => <YtdComparisonCard key={definition.code} comparison={comparison} cutoffMonth={data.cutoffMonth} definition={definition} />)}
      </div>
    </div>
  </section>;
}
