"use client";

import { useState } from "react";
import { EmptyState } from "@/components/ui/EmptyState";
import { Panel } from "@/components/ui/Panel";
import type { Ga4WebsiteAnalyticsReport } from "../server/ga4";
import { MAX_TRAFFIC_INVESTIGATION_BUCKET_DAYS } from "../lib/trafficInvestigation";
import { AnalyticsTrafficInvestigation } from "./AnalyticsTrafficInvestigation";
import styles from "./AnalyticsTrafficOverview.module.css";

type TrafficMetric = "sessions" | "activeUsers" | "pageViews";
type TrafficPoint = { date: string; current: number; previous: number | null; endDate: string };
const METRICS: Array<{ key: TrafficMetric; label: string }> = [{ key: "sessions", label: "Sessions" }, { key: "activeUsers", label: "Active Users" }, { key: "pageViews", label: "Page Views" }];
const BOX = { width: 760, height: 246, left: 16, right: 16, top: 16, bottom: 34 };
const formatNumber = (value: number) => new Intl.NumberFormat("en-GB", { maximumFractionDigits: 0 }).format(value);
const formatCompactNumber = (value: number) => value >= 1_000 ? `${(value / 1_000).toFixed(value % 1_000 === 0 ? 0 : 1)}k` : formatNumber(value);
const formatDate = (value: string) => new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`));

function comparison(current: number, previous: number | undefined) {
  if (previous === undefined || previous === 0) return null;
  const value = ((current - previous) / Math.abs(previous)) * 100;
  return Number.isFinite(value) ? value : null;
}

function aggregateTraffic(report: Ga4WebsiteAnalyticsReport, metric: TrafficMetric): TrafficPoint[] {
  const bucketSize = report.periodDays === 90 ? MAX_TRAFFIC_INVESTIGATION_BUCKET_DAYS : 1;
  return Array.from({ length: Math.ceil(report.dailyTraffic.length / bucketSize) }, (_, bucketIndex) => {
    const start = bucketIndex * bucketSize;
    const currentBucket = report.dailyTraffic.slice(start, start + bucketSize);
    const previousBucket = report.previousDailyTraffic.slice(start, start + bucketSize);
    return { date: currentBucket[0]?.date ?? "", endDate: currentBucket[currentBucket.length - 1]?.date ?? currentBucket[0]?.date ?? "", current: currentBucket.reduce((total, point) => total + point[metric], 0), previous: previousBucket.length ? previousBucket.reduce((total, point) => total + point[metric], 0) : null };
  });
}

function tickIndexes(length: number) {
  const count = Math.min(length, 6);
  return count <= 1 ? [0] : Array.from({ length: count }, (_, index) => Math.round((index * (length - 1)) / (count - 1)));
}

export function AnalyticsTrafficOverview({ report }: { report: Ga4WebsiteAnalyticsReport }) {
  const [metricKey, setMetricKey] = useState<TrafficMetric>("pageViews");
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [hoveredPosition, setHoveredPosition] = useState<number | null>(null);
  const [selectedBucket, setSelectedBucket] = useState<{ startDate: string; endDate: string } | null>(null);
  const metric = METRICS.find((candidate) => candidate.key === metricKey) ?? METRICS[0];
  const points = aggregateTraffic(report, metricKey);
  const maximum = Math.max(1, ...points.flatMap((point) => [point.current, point.previous ?? 0]));
  const yMaximum = Math.ceil(maximum / 4) * 4;
  const plotWidth = BOX.width - BOX.left - BOX.right;
  const plotHeight = BOX.height - BOX.top - BOX.bottom;
  const groupWidth = plotWidth / Math.max(points.length, 1);
  const currentWidth = Math.max(2, Math.min(12, groupWidth * 0.52));
  const previousWidth = Math.max(1.5, Math.min(8, groupWidth * 0.24));
  const y = (value: number) => BOX.top + plotHeight - (value / yMaximum) * plotHeight;
  const x = (index: number) => BOX.left + groupWidth * index + groupWidth / 2;
  const hovered = hoveredIndex === null ? null : points[hoveredIndex];
  const currentTotal = report.metrics[metricKey];
  const previousTotal = report.previousMetrics?.[metricKey];
  const totalChange = comparison(currentTotal, previousTotal);
  const hoverChange = hovered ? comparison(hovered.current, hovered.previous ?? undefined) : null;
  const dateRangeLabel = hovered?.endDate && hovered.endDate !== hovered.date ? `${formatDate(hovered.date)}–${formatDate(hovered.endDate)}` : hovered ? formatDate(hovered.date) : "";
  const setHoveredBucket = (index: number, target: SVGRectElement) => {
    const svgBounds = target.ownerSVGElement?.getBoundingClientRect();
    const targetBounds = target.getBoundingClientRect();
    setHoveredIndex(index);
    setHoveredPosition(svgBounds?.width ? ((targetBounds.left + targetBounds.width / 2 - svgBounds.left) / svgBounds.width) * 100 : null);
  };
  const clearHoveredBucket = () => { setHoveredIndex(null); setHoveredPosition(null); };
  const selectBucket = (point: TrafficPoint) => setSelectedBucket({ startDate: point.date, endDate: point.endDate });

  return <><Panel className={styles.panel}>
    <header className={styles.header}>
      <div><h2>Traffic Summary</h2><div className={styles.summary}><strong>{formatNumber(currentTotal)}</strong><span className={totalChange === null ? styles.neutral : totalChange > 0 ? styles.positive : totalChange < 0 ? styles.negative : styles.neutral}>{totalChange === null ? "—" : `${totalChange > 0 ? "+" : ""}${totalChange.toFixed(1)}%`}</span></div></div>
      <div className={styles.metricTabs} role="tablist" aria-label="Traffic metric">{METRICS.map((option) => <button key={option.key} type="button" role="tab" aria-selected={option.key === metricKey} className={option.key === metricKey ? styles.activeTab : undefined} onClick={() => { setMetricKey(option.key); clearHoveredBucket(); }}>{option.label}</button>)}</div>
    </header>
    {points.length ? <div className={styles.chartFrame}>
      <svg className={styles.chart} viewBox={`0 0 ${BOX.width} ${BOX.height}`} role="img" aria-label={`${metric.label} for the selected period compared with the previous equivalent period`} onPointerLeave={clearHoveredBucket}>
        {[0.5, 1].map((ratio) => <line key={ratio} className={styles.gridLine} x1={BOX.left} x2={BOX.width - BOX.right} y1={BOX.top + plotHeight * ratio} y2={BOX.top + plotHeight * ratio} />)}
        <text className={styles.yLabel} x={BOX.width - BOX.right} y={BOX.top + 3} textAnchor="end">{formatCompactNumber(yMaximum)}</text>
        {points.map((point, index) => <g key={`${point.date}-${index}`}>{point.previous !== null ? <rect className={styles.previousBar} x={x(index) - previousWidth - 1} y={y(point.previous)} width={previousWidth} height={Math.max(0, BOX.top + plotHeight - y(point.previous))} rx="1" /> : null}<rect className={styles.currentBar} x={x(index) + 1} y={y(point.current)} width={currentWidth} height={Math.max(0, BOX.top + plotHeight - y(point.current))} rx="1.5" /></g>)}
        {hoveredIndex !== null ? <rect className={styles.hoverBand} x={BOX.left + groupWidth * hoveredIndex} y={BOX.top} width={groupWidth} height={plotHeight} /> : null}
        {points.map((point, index) => <rect key={`target-${point.date}-${index}`} className={styles.hoverTarget} x={BOX.left + groupWidth * index} y={BOX.top} width={groupWidth} height={plotHeight} role="button" tabIndex={0} aria-label={`Investigate ${point.endDate !== point.date ? `${formatDate(point.date)} to ${formatDate(point.endDate)}` : formatDate(point.date)}`} onPointerEnter={(event) => setHoveredBucket(index, event.currentTarget)} onClick={() => selectBucket(point)} onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); selectBucket(point); } }} />)}
        {tickIndexes(points.length).map((index) => <text key={points[index].date} className={styles.dateLabel} x={x(index)} y={BOX.height - 10}>{formatDate(points[index].date)}</text>)}
      </svg>
      {hovered ? <div className={styles.tooltip} style={{ left: `${Math.min(88, Math.max(12, hoveredPosition ?? (x(hoveredIndex ?? 0) / BOX.width) * 100))}%` }}><strong>{dateRangeLabel}</strong><span>Current <b>{formatNumber(hovered.current)}</b></span><span>Previous <b>{hovered.previous === null ? "—" : formatNumber(hovered.previous)}</b></span>{hoverChange !== null ? <span className={hoverChange > 0 ? styles.positive : hoverChange < 0 ? styles.negative : styles.neutral}>{hoverChange > 0 ? "+" : ""}{hoverChange.toFixed(1)}%</span> : null}</div> : null}
    </div> : <EmptyState title="No daily traffic data" />}
  </Panel><AnalyticsTrafficInvestigation selection={selectedBucket} onClose={() => setSelectedBucket(null)} /></>;
}
