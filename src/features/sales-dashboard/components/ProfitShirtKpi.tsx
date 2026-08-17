"use client";

import { Surface } from "@/components/ui/Surface";
import type { MetricResult } from "../domain/types";
import { previousYearComparisonState, profitProgress } from "../lib/metricDisplay";
import { ComparisonBadge } from "./ComparisonBadge";
import { AnimatedMetricValue } from "./AnimatedMetricValue";
import { MonthlyProfitTshirt } from "./MonthlyProfitTshirt";
import styles from "./ProfitShirtKpi.module.css";

function currency(value: number | null) {
  return value === null ? "—" : new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
}

export function ProfitShirtKpi({ metric, tvMode = false }: { metric: MetricResult; animationKey?: string | number; animationDelayMs?: number; tvMode?: boolean }) {
  const target = metric.target;
  const progress = target === null ? null : profitProgress(metric.value, target);
  const isAboveTarget = progress !== null && progress > 1;
  const comparisonState = previousYearComparisonState(metric.value, metric.previousYear);

  return (
    <Surface variant="metric" className={`${styles.card} ${tvMode ? styles.tvCard : ""}`} data-tv-kpi={tvMode ? "true" : undefined}>
      <div className={styles.label}>Monthly Profit</div>
      <AnimatedMetricValue value={metric.value} format="currency" maximumFractionDigits={2} className={styles.value} tvKpiValue={tvMode} />
      <div className={styles.progress}>{progress === null ? "—" : `${(progress * 100).toFixed(1)}% of ${currency(target)}`}</div>
      <div className={styles.shirt} data-tv-kpi-visual={tvMode ? "true" : undefined}><MonthlyProfitTshirt value={metric.value} target={target} tvMode={tvMode} /></div>
      {isAboveTarget ? <span className={styles.aboveTarget}>+{((progress - 1) * 100).toFixed(1)}%</span> : null}
      <div className={styles.comparison}>
        {metric.previousYear === null ? <span>No previous-year comparison</span> : <><span>Last year <strong>{currency(metric.previousYear)}</strong></span><ComparisonBadge percentageChange={metric.percentageChange} state={comparisonState} /></>}
      </div>
    </Surface>
  );
}
