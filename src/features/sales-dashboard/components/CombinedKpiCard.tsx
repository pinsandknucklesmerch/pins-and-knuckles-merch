"use client";

import { BentoPanel } from "@/components/ui/BentoPanel";
import type { MetricResult } from "../domain/types";
import { formatPercentagePoints, previousYearComparisonState, targetState } from "../lib/metricDisplay";
import styles from "./CombinedKpiCard.module.css";

function value(metric: MetricResult) {
  if (metric.value === null) return "—";
  return metric.format === "percent"
    ? formatPercentagePoints(metric.value)
    : metric.value.toLocaleString("en-GB", { maximumFractionDigits: metric.format === "currency" ? 2 : 0 });
}

function target(metric: MetricResult) {
  if (metric.target === null || metric.targetProgress === null) return null;
  const display = metric.format === "percent" ? formatPercentagePoints(metric.target) : metric.target.toLocaleString("en-GB");
  return { display, progress: Math.min(100, Math.max(0, metric.targetProgress)), state: targetState(metric.value, metric.target) };
}

function comparison(metric: MetricResult) {
  if (metric.previousYear === null) return "No previous-year comparison";
  const previous = metric.format === "percent" ? formatPercentagePoints(metric.previousYear) : metric.previousYear.toLocaleString("en-GB");
  const difference = metric.difference === null ? null : metric.format === "percent" ? formatPercentagePoints(metric.difference) : metric.difference.toLocaleString("en-GB");
  const relative = metric.percentageChange === null ? null : `${metric.percentageChange > 0 ? "+" : ""}${metric.percentageChange.toFixed(1)}%`;
  return { previous, difference, relative, state: previousYearComparisonState(metric.value, metric.previousYear) };
}

function KpiSection({ metric, divided }: { metric: MetricResult; divided?: boolean }) {
  const metricTarget = target(metric);
  const metricComparison = comparison(metric);
  return (
    <section className={divided ? styles.divided : styles.section} aria-label={metric.label}>
      <div className={styles.metricLabel}>{metric.label}</div>
      <div className={styles.value}>{value(metric)}</div>
      {metricTarget ? (
        <div className={styles.target}>
          <div className={styles.targetRow}><span>Target {metricTarget.display}</span><span>{metric.targetProgress?.toFixed(1)}%</span></div>
          <div className={styles.track} role="progressbar" aria-label={`${metric.label} target progress`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={metricTarget.progress}>
            <span className={metricTarget.state === "target-met" ? styles.targetMet : styles.fill} style={{ width: `${metricTarget.progress}%` }} />
          </div>
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

export function CombinedKpiCard({ title, first, second }: { title: string; first: MetricResult; second: MetricResult }) {
  return (
    <BentoPanel className={styles.card} glow>
      <h2 className={styles.title}>{title}</h2>
      <div className={styles.sections}>
        <KpiSection metric={first} />
        <KpiSection metric={second} divided />
      </div>
    </BentoPanel>
  );
}
