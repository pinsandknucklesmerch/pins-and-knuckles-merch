"use client";

import type { CSSProperties } from "react";
import { AreaChart, MetricProvider, type FormatOption } from "metricui";
import { Surface } from "@/components/ui/Surface";
import { DASHBOARD_MONTHS } from "../types";
import type { YearToDateData } from "../domain/types";
import { AnimatedMetricValue } from "./AnimatedMetricValue";
import styles from "./YearToDateView.module.css";

const currency: FormatOption = { style: "currency", currency: "GBP", compact: false, precision: 0 };
const gbp = (value: number | null) => value === null ? "—" : new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(value);

export function YearToDateView({ data, showHeading = true, tvMode = false }: { data: YearToDateData; showHeading?: boolean; tvMode?: boolean }) {
  const varianceStatus = data.variance === null ? "—" : `${data.variance >= 0 ? "Ahead" : "Behind"} ${gbp(Math.abs(data.variance))}`;
  const metrics: Array<{ label: string; value: number | string | null; format?: "currency" | "percent" }> = [
    { label: "YTD Profit", value: data.ytdActual, format: "currency" },
    { label: "YTD Target", value: data.ytdTarget, format: "currency" },
    { label: "Status", value: varianceStatus },
    { label: "Target Achievement", value: data.achievementRate, format: "percent" },
    { label: "Projected Year End", value: data.projectedYearEnd, format: "currency" },
    { label: "Annual Target", value: data.annualTarget, format: "currency" },
  ];
  const actual = [{ id: "Cumulative actual", data: data.cumulativeActualByMonth.map((value, index) => ({ x: DASHBOARD_MONTHS[index].slice(0, 3), y: value })) }];
  const target = [{ id: "Cumulative target", data: data.cumulativeTargetByMonth.map((value, index) => ({ x: DASHBOARD_MONTHS[index].slice(0, 3), y: value })) }];
  return <section className="grid gap-2.5" aria-labelledby={showHeading ? "year-to-date-title" : undefined} data-tv-view={tvMode ? "ytd" : undefined}>
    <div className="flex items-center gap-2" data-tv-group={tvMode ? "ytd-summary" : undefined} style={tvMode ? { "--tv-enter-index": 0 } as CSSProperties : undefined}>{showHeading ? <h2 id="year-to-date-title" className="text-sm font-semibold">Year to Date</h2> : null}{!data.isComplete ? <details className="text-xs text-amber-600 dark:text-amber-300"><summary className="cursor-pointer">Incomplete data</summary><span>{data.missingMonths.map((month) => DASHBOARD_MONTHS[month - 1]).join(", ")}</span></details> : null}</div>
    <div className={styles.metricGrid} data-tv-group={tvMode ? "ytd-metrics" : undefined} style={tvMode ? { "--tv-enter-index": 1 } as CSSProperties : undefined}>{metrics.map(({ label, value, format }, index) => {
      const metricValue = typeof value === "number" && Number.isFinite(value) ? value : null;
      const maximumFractionDigits = format === "percent" ? 1 : 0;
      return <Surface key={label} variant="metric" magic data-tv-kpi={tvMode ? "true" : undefined} style={tvMode ? { "--tv-enter-index": index + 1 } as CSSProperties : undefined} className={label === "Status" && data.variance !== null ? (data.variance >= 0 ? styles.ahead : styles.behind) : ""}><div className="text-xs text-muted-foreground">{label}</div>{format ? <AnimatedMetricValue value={metricValue} format={format} maximumFractionDigits={maximumFractionDigits} className="mt-1 text-lg font-semibold tabular-nums" tvKpiValue={tvMode} /> : <div data-tv-kpi-value={tvMode ? "true" : undefined} className="mt-1 text-lg font-semibold tabular-nums">{value}</div>}</Surface>;
    })}</div>
    <div className={styles.chart} data-tv-group={tvMode ? "ytd-chart" : undefined} style={tvMode ? { "--tv-enter-index": 2 } as CSSProperties : undefined}><MetricProvider dense={false}><AreaChart data={actual} comparisonData={target} seriesStyles={{ "Cumulative actual": { color: "#059669", lineWidth: 2.5 }, "Cumulative target": { color: "#4f8cff", lineWidth: 2 } }} format={currency} height={300} gradient={false} areaOpacity={0.08} curve="monotoneX" enablePoints enableGridX={false} enableGridY legend chartNullMode="gap" /></MetricProvider></div>
  </section>;
}
