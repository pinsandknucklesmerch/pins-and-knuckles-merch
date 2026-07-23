"use client";

import { BentoPanel } from "@/components/ui/BentoPanel";
import type { MetricResult } from "../domain/types";
import { MONTHLY_PROFIT_TARGET, profitProgress, targetState } from "../lib/metricDisplay";
import { ProfitShirtMeter } from "./ProfitShirtMeter";
import styles from "./ProfitShirtKpi.module.css";

function currency(value: number | null) {
  return value === null ? "—" : new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
}

export function ProfitShirtKpi({ metric }: { metric: MetricResult }) {
  const progress = profitProgress(metric.value, MONTHLY_PROFIT_TARGET);
  const state = targetState(metric.value, MONTHLY_PROFIT_TARGET);
  const isAboveTarget = progress !== null && progress > 1;
  const comparison = metric.previousYear === null ? "—" : currency(metric.previousYear);
  const delta = metric.percentageChange === null ? "—" : `${metric.percentageChange > 0 ? "+" : ""}${metric.percentageChange.toFixed(1)}%`;

  return (
    <BentoPanel className={styles.card} glow>
      <div className={styles.label}>Monthly Profit</div>
      <div className={styles.shirt}><ProfitShirtMeter value={metric.value} target={MONTHLY_PROFIT_TARGET} targetState={state} /></div>
      <div className={styles.value}>{currency(metric.value)}</div>
      <div className={styles.progress}>{progress === null ? "—" : `${(progress * 100).toFixed(1)}% of £155,000`}</div>
      {isAboveTarget ? <span className={styles.aboveTarget}>+{((progress - 1) * 100).toFixed(1)}%</span> : null}
      <div className={styles.comparison}>
        <span>Last year <strong>{comparison}</strong></span>
        <span className={metric.percentageChange !== null && metric.percentageChange < 0 ? styles.negative : styles.delta}>{delta}</span>
      </div>
    </BentoPanel>
  );
}
