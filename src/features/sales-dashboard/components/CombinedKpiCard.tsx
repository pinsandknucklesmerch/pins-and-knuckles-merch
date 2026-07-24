"use client";

import { BentoPanel } from "@/components/ui/BentoPanel";
import { BulletChart, CardShell, type DataRow } from "metricui";
import type { MetricResult } from "../domain/types";
import { formatPercentagePoints, previousYearComparisonState, targetBullet } from "../lib/metricDisplay";
import { ComparisonBadge } from "./ComparisonBadge";
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

function KpiSection({ metric, divided, className }: { metric: MetricResult; divided?: boolean; className?: string }) {
  const metricTarget = target(metric);
  const state = previousYearComparisonState(metric.value, metric.previousYear);
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
            exportable={false}
            className={styles.bullet}
          />
        </div>
      ) : null}
      {metric.previousYear === null ? (
        <div className={styles.reference}>No previous-year comparison</div>
      ) : (
        <div className={styles.comparison}>
          <span>Last year {metric.format === "percent" ? formatPercentagePoints(metric.previousYear) : metric.previousYear.toLocaleString("en-GB")}</span>
          <ComparisonBadge absoluteChange={metric.format === "percent" ? null : metric.difference} percentagePointChange={metric.format === "percent" ? metric.difference : null} percentageChange={metric.percentageChange} state={state} />
        </div>
      )}
    </section>
  );
}

export function CombinedKpiCard({ title, first, second, third, exportData }: { title?: string; first: MetricResult; second?: MetricResult; third?: MetricResult; exportData: DataRow[] }) {
  return (
    <CardShell aiTitle={title ?? "Sales Performance"} bare className="sales-kpi-export !p-0" exportable={{ data: exportData }}>
      <BentoPanel className={styles.card} glow>
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
    </CardShell>
  );
}
