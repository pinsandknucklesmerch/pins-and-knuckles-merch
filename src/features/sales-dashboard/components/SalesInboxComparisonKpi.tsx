"use client";

import { BentoPanel } from "@/components/ui/BentoPanel";
import type { MetricResult } from "../domain/types";
import { comparisonArcRatio } from "../lib/metricDisplay";
import { ComparisonArcGauge } from "./ComparisonArcGauge";
import styles from "./SalesInboxComparisonKpi.module.css";

function number(value: number | null) { return value === null ? "—" : value.toLocaleString("en-GB"); }

export function SalesInboxComparisonKpi({ metric }: { metric: MetricResult }) {
  const ratio = comparisonArcRatio(metric.value, metric.previousYear);
  const hasComparison = ratio !== null;
  const isAbove = hasComparison && ratio > 1;
  const difference = metric.difference === null ? null : `${metric.difference > 0 ? "+" : ""}${metric.difference.toLocaleString("en-GB")}`;
  const percentage = metric.percentageChange === null ? null : `${metric.percentageChange > 0 ? "+" : ""}${metric.percentageChange.toFixed(1)}%`;

  return (
    <BentoPanel className={styles.card} glow>
      <div className={styles.label}>Sales Inbox Enquiries</div>
      <div className={styles.arc}><ComparisonArcGauge current={metric.value} previousYear={metric.previousYear} /></div>
      <div className={styles.value}>{number(metric.value)}</div>
      {hasComparison ? <div className={styles.reference}>Last year {number(metric.previousYear)}</div> : <div className={styles.reference}>No previous-year comparison</div>}
      {hasComparison ? <div className={isAbove ? styles.above : styles.below}>{difference} · {percentage} vs last year</div> : null}
    </BentoPanel>
  );
}
