"use client";

import { AreaChart, MetricProvider, type FormatOption } from "metricui";
import { Surface } from "@/components/ui/Surface";
import { DASHBOARD_MONTHS } from "../types";
import type { YearToDateData } from "../domain/types";
import styles from "./YearToDateView.module.css";

const currency: FormatOption = { style: "currency", currency: "GBP", compact: false, precision: 0 };
const gbp = (value: number | null) => value === null ? "—" : new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(value);

export function YearToDateView({ data }: { data: YearToDateData }) {
  const varianceStatus = data.variance === null ? "—" : `${data.variance >= 0 ? "Ahead" : "Behind"} ${gbp(Math.abs(data.variance))}`;
  const metrics = [["YTD Profit", gbp(data.ytdActual)], ["YTD Target", gbp(data.ytdTarget)], ["Status", varianceStatus], ["Target Achievement", data.achievementRate === null ? "—" : `${data.achievementRate.toFixed(1)}%`], ["Projected Year End", gbp(data.projectedYearEnd)], ["Annual Target", gbp(data.annualTarget)]];
  const actual = [{ id: "Cumulative actual", data: data.cumulativeActualByMonth.map((value, index) => ({ x: DASHBOARD_MONTHS[index].slice(0, 3), y: value })) }];
  const target = [{ id: "Cumulative target", data: data.cumulativeTargetByMonth.map((value, index) => ({ x: DASHBOARD_MONTHS[index].slice(0, 3), y: value })) }];
  return <section className="grid gap-2.5" aria-labelledby="year-to-date-title">
    <div className="flex items-center gap-2"><h2 id="year-to-date-title" className="text-sm font-semibold">Year to Date</h2>{!data.isComplete ? <details className="text-xs text-amber-600 dark:text-amber-300"><summary className="cursor-pointer">Incomplete data</summary><span>{data.missingMonths.map((month) => DASHBOARD_MONTHS[month - 1]).join(", ")}</span></details> : null}</div>
    <div className={styles.metricGrid}>{metrics.map(([label, value]) => <Surface key={label} variant="metric" magic className={label === "Status" && data.variance !== null ? (data.variance >= 0 ? styles.ahead : styles.behind) : ""}><div className="text-xs text-muted-foreground">{label}</div><div className="mt-1 text-lg font-semibold tabular-nums">{value}</div></Surface>)}</div>
    <div className={styles.chart}><MetricProvider dense={false}><AreaChart data={actual} comparisonData={target} seriesStyles={{ "Cumulative actual": { color: "#059669", lineWidth: 2.5 }, "Cumulative target": { color: "#4f8cff", lineWidth: 2 } }} format={currency} height={300} gradient={false} areaOpacity={0.08} curve="monotoneX" enablePoints enableGridX={false} enableGridY legend chartNullMode="gap" /></MetricProvider></div>
  </section>;
}
