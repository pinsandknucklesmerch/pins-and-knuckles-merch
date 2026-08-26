"use client";

import { useId, useState } from "react";
import { EmptyState } from "@/components/ui/EmptyState";
import { Select } from "@/components/ui/Select";
import { Panel } from "@/components/ui/Panel";
import type { Ga4WebsiteAnalyticsReport } from "../server/ga4";
import styles from "./AnalyticsTrafficOverview.module.css";

type TrafficMetric = "sessions" | "activeUsers" | "pageViews";

const METRICS: Array<{ key: TrafficMetric; label: string }> = [
  { key: "sessions", label: "Sessions" },
  { key: "activeUsers", label: "Users" },
  { key: "pageViews", label: "Page Views" },
];

const BOX = { width: 760, height: 324, left: 52, right: 24, top: 18, bottom: 44 };

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-GB", { maximumFractionDigits: 0 }).format(value);
}

function formatCompactNumber(value: number) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(value % 1_000_000 === 0 ? 0 : 1)}m`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(value % 1_000 === 0 ? 0 : 1)}k`;
  return formatNumber(value);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`));
}

function comparison(current: number, previous: number | undefined) {
  if (previous === undefined || previous === 0) return null;
  const value = ((current - previous) / Math.abs(previous)) * 100;
  return Number.isFinite(value) ? value : null;
}

function smoothPath(points: Array<{ x: number; y: number }>) {
  if (!points.length) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
  return points.slice(1).reduce((path, point, index) => {
    const previous = points[index];
    const controlX = (previous.x + point.x) / 2;
    return `${path} C ${controlX.toFixed(2)} ${previous.y.toFixed(2)}, ${controlX.toFixed(2)} ${point.y.toFixed(2)}, ${point.x.toFixed(2)} ${point.y.toFixed(2)}`;
  }, `M ${points[0].x.toFixed(2)} ${points[0].y.toFixed(2)}`);
}

function axisTickIndexes(length: number) {
  const count = Math.min(length, 6);
  if (count <= 1) return [0];
  return Array.from({ length: count }, (_, index) => Math.round((index * (length - 1)) / (count - 1)));
}

export function AnalyticsTrafficOverview({ report }: { report: Ga4WebsiteAnalyticsReport }) {
  const [metricKey, setMetricKey] = useState<TrafficMetric>("sessions");
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const gradientId = useId().replace(/:/g, "");
  const metric = METRICS.find((candidate) => candidate.key === metricKey) ?? METRICS[0];
  const currentTotal = report.metrics[metricKey];
  const previousTotal = report.previousMetrics?.[metricKey];
  const totalChange = comparison(currentTotal, previousTotal);
  const points = report.dailyTraffic.map((point, index) => ({ date: point.date, current: point[metricKey], previous: report.previousDailyTraffic[index]?.[metricKey] ?? null }));
  const hasPreviousSeries = report.previousDailyTraffic.length === points.length && points.length > 0;
  const maximum = Math.max(1, ...points.flatMap((point) => [point.current, point.previous ?? 0]));
  const yMaximum = Math.ceil(maximum / 4) * 4;
  const plotWidth = BOX.width - BOX.left - BOX.right;
  const plotHeight = BOX.height - BOX.top - BOX.bottom;
  const x = (index: number) => BOX.left + (points.length <= 1 ? plotWidth / 2 : (plotWidth / (points.length - 1)) * index);
  const y = (value: number) => BOX.top + plotHeight - (value / yMaximum) * plotHeight;
  const currentPoints = points.map((point, index) => ({ x: x(index), y: y(point.current) }));
  const previousPoints = hasPreviousSeries ? points.map((point, index) => ({ x: x(index), y: y(point.previous ?? 0) })) : [];
  const currentPath = smoothPath(currentPoints);
  const previousPath = smoothPath(previousPoints);
  const areaPath = currentPoints.length ? `${currentPath} L ${currentPoints[currentPoints.length - 1].x.toFixed(2)} ${(BOX.top + plotHeight).toFixed(2)} L ${currentPoints[0].x.toFixed(2)} ${(BOX.top + plotHeight).toFixed(2)} Z` : "";
  const hovered = hoveredIndex === null ? null : points[hoveredIndex];
  const hoverChange = hovered ? comparison(hovered.current, hovered.previous ?? undefined) : null;

  return <Panel className={styles.panel}>
    <header className={styles.header}>
      <div><h2>Traffic Overview</h2><div className={styles.summary}><strong>{formatNumber(currentTotal)}</strong><span className={totalChange === null ? styles.neutral : totalChange > 0 ? styles.positive : totalChange < 0 ? styles.negative : styles.neutral}>{totalChange === null ? "—" : `${totalChange > 0 ? "+" : ""}${totalChange.toFixed(1)}%`}</span></div></div>
      <Select aria-label="Traffic metric" className={styles.metricSelect} value={metric.key} onValueChange={(value) => setMetricKey(METRICS.find((candidate) => candidate.key === value)?.key ?? "sessions")}>
        {METRICS.map((option) => <option key={option.key} value={option.key}>{option.label}</option>)}
      </Select>
    </header>
    {points.length ? <div className={styles.chartFrame}>
      <svg className={styles.chart} viewBox={`0 0 ${BOX.width} ${BOX.height}`} role="img" aria-label={`${metric.label} for the selected period compared with the previous equivalent period`} onPointerMove={(event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        const svgX = ((event.clientX - rect.left) / rect.width) * BOX.width;
        const index = Math.round(((svgX - BOX.left) / plotWidth) * Math.max(0, points.length - 1));
        setHoveredIndex(Math.max(0, Math.min(points.length - 1, index)));
      }} onPointerLeave={() => setHoveredIndex(null)}>
        <defs><linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1"><stop offset="0" className={styles.areaStart} /><stop offset="1" className={styles.areaEnd} /></linearGradient></defs>
        {Array.from({ length: 5 }, (_, index) => {
          const value = (yMaximum / 4) * index;
          const lineY = y(value);
          return <g key={value}><line className={index === 0 ? styles.baseline : styles.gridLine} x1={BOX.left} x2={BOX.width - BOX.right} y1={lineY} y2={lineY} /><text className={styles.axisLabel} x={BOX.left - 8} y={lineY + 3} textAnchor="end">{formatCompactNumber(value)}</text></g>;
        })}
        {axisTickIndexes(points.length).map((index) => <text key={points[index].date} className={styles.dateLabel} x={x(index)} y={BOX.height - 12}>{formatDate(points[index].date)}</text>)}
        {areaPath ? <path d={areaPath} fill={`url(#${gradientId})`} /> : null}
        {hasPreviousSeries ? <path className={styles.previousLine} d={previousPath} /> : null}
        <path className={styles.currentLine} d={currentPath} />
        {hoveredIndex !== null && hovered ? <g><line className={styles.hoverLine} x1={x(hoveredIndex)} x2={x(hoveredIndex)} y1={BOX.top} y2={BOX.top + plotHeight} />{hasPreviousSeries && hovered.previous !== null ? <circle className={styles.previousPoint} cx={x(hoveredIndex)} cy={y(hovered.previous)} r="3" /> : null}<circle className={styles.currentPoint} cx={x(hoveredIndex)} cy={y(hovered.current)} r="3.5" /></g> : null}
      </svg>
      {hoveredIndex !== null && hovered ? <div className={styles.tooltip} style={{ left: `${(x(hoveredIndex) / BOX.width) * 100}%` }}><strong>{formatDate(hovered.date)}</strong><span>Current <b>{formatNumber(hovered.current)}</b></span><span>Previous <b>{hovered.previous === null ? "—" : formatNumber(hovered.previous)}</b></span>{hoverChange !== null ? <span className={hoverChange > 0 ? styles.positive : hoverChange < 0 ? styles.negative : styles.neutral}>{hoverChange > 0 ? "+" : ""}{hoverChange.toFixed(1)}%</span> : null}</div> : null}
    </div> : <EmptyState title="No daily traffic data" />}
  </Panel>;
}
