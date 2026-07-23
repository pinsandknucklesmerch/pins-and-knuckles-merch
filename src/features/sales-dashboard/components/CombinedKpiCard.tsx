"use client";

import { BentoPanel } from "@/components/ui/BentoPanel";
import { BulletChart } from "metricui";
import type { MetricResult } from "../domain/types";
import { formatPercentagePoints, previousYearComparisonState, targetBullet } from "../lib/metricDisplay";
import styles from "./CombinedKpiCard.module.css";

function value(metric: MetricResult) {
  if (metric.value === null) return "—";
  return metric.format === "percent"
    ? formatPercentagePoints(metric.value)
    : metric.value.toLocaleString("en-GB", { maximumFractionDigits: metric.format === "currency" ? 2 : 0 });
}

function target(metric: MetricResult) {
  const bullet = targetBullet(metric.value, metric.target);
  if (metric.target === null || metric.targetProgress === null || !bullet) return null;
  const display = metric.format === "percent" ? formatPercentagePoints(metric.target) : metric.target.toLocaleString("en-GB");
  return { display, progress: metric.targetProgress, bullet };
}

function comparison(metric: MetricResult) {
  if (metric.previousYear === null) return "No previous-year comparison";
  const previous = metric.format === "percent" ? formatPercentagePoints(metric.previousYear) : metric.previousYear.toLocaleString("en-GB");
  const difference = metric.difference === null ? null : metric.format === "percent" ? formatPercentagePoints(metric.difference) : metric.difference.toLocaleString("en-GB");
  const relative = metric.percentageChange === null ? null : `${metric.percentageChange > 0 ? "+" : ""}${metric.percentageChange.toFixed(1)}%`;
  return { previous, difference, relative, state: previousYearComparisonState(metric.value, metric.previousYear) };
}

function KpiSection({ metric, divided, className }: { metric: MetricResult; divided?: boolean; className?: string }) {
  const metricTarget = target(metric);
  const metricComparison = comparison(metric);
  return (
    <section className={`${divided ? styles.divided : styles.section} ${className ?? ""}`} aria-label={metric.label}>
      <div className={styles.metricLabel}>{metric.label}</div>
      <div className={styles.value}>{value(metric)}</div>
      {metricTarget ? (
        <div className={styles.target}>
          <div className={styles.targetRow}><span>Target {metricTarget.display}</span><span>{metric.targetProgress?.toFixed(1)}%</span></div>
          <BulletChart
            data={[{
              id: metric.code,
              title: null,
              ranges: [metricTarget.bullet.max],
              measures: [metricTarget.bullet.value],
              markers: [metricTarget.bullet.target],
            }]}
            format={metric.format === "percent" ? { style: "percent", precision: 1 } : { style: "number", compact: false, precision: 0 }}
            height={28}
            layout="horizontal"
            spacing={0}
            rangeColors={["hsl(var(--border))"]}
            measureColors={[metricTarget.bullet.measureColor]}
            markerColors={["hsl(var(--foreground))"]}
            measureSize={0.5}
            markerSize={0.85}
            showAxis={false}
            animate
            className={styles.bullet}
          />
        </div>
      ) : null}
      {typeof metricComparison === "string" ? (
        <div className={styles.reference}>{metricComparison}</div>
      ) : (
        <div className={styles.comparison}>
          <span>Last year {metricComparison.previous}</span>
          {metricComparison.difference !== null ? (
            <span className={metricComparison.state === "negative" ? styles.negative : metricComparison.state === "positive" ? styles.positive : styles.neutral}>
              {metricComparison.difference.startsWith("-") ? "" : "+"}{metricComparison.difference}{metricComparison.relative ? ` · ${metricComparison.relative}` : ""}
            </span>
          ) : null}
        </div>
      )}
    </section>
  );
}

export function CombinedKpiCard({ title, first, second, third, verticalAlign = "start" }: { title?: string; first: MetricResult; second?: MetricResult; third?: MetricResult; verticalAlign?: "start" | "center" }) {
  return (
    <BentoPanel className={`${styles.card} ${verticalAlign === "center" ? styles.centered : ""}`} glow>
      {title ? <h2 className={styles.title}>{title}</h2> : null}
      {third && second ? (
        <div className={`${title ? styles.sections : styles.sectionsWithoutTitle} ${styles.stackedSections}`}>
          <div className={styles.topRow}>
            <KpiSection metric={first} />
            <KpiSection metric={second} divided />
          </div>
          <KpiSection metric={third} className={styles.fullWidthSection} />
        </div>
      ) : (
        <div className={`${title ? styles.sections : styles.sectionsWithoutTitle} ${second ? "" : styles.singleSection}`}>
          <KpiSection metric={first} />
          {second ? <KpiSection metric={second} divided /> : null}
        </div>
      )}
    </BentoPanel>
  );
}
