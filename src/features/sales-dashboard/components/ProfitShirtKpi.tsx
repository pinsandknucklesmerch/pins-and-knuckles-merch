"use client";

import { BentoPanel } from "@/components/ui/BentoPanel";
import { CardShell, type DataRow } from "metricui";
import type { MetricResult } from "../domain/types";
import { MONTHLY_PROFIT_TARGET, previousYearComparisonState, profitProgress, targetState } from "../lib/metricDisplay";
import { ComparisonBadge } from "./ComparisonBadge";
import { ProfitShirtMeter } from "./ProfitShirtMeter";
import styles from "./ProfitShirtKpi.module.css";

function currency(value: number | null) {
  return value === null ? "—" : new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value);
}

export function ProfitShirtKpi({ metric, exportData }: { metric: MetricResult; exportData: DataRow[] }) {
  const progress = profitProgress(metric.value, MONTHLY_PROFIT_TARGET);
  const state = targetState(metric.value, MONTHLY_PROFIT_TARGET);
  const isAboveTarget = progress !== null && progress > 1;
  const comparisonState = previousYearComparisonState(metric.value, metric.previousYear);

  return (
    <CardShell aiTitle="Monthly Profit" bare className="sales-kpi-export !p-0" exportable={{ data: exportData }} copyValue={metric.value === null ? "" : String(metric.value)}>
      <BentoPanel className={styles.card} glow>
      <div className={styles.label}>Monthly Profit</div>
      <div className={styles.value}>{currency(metric.value)}</div>
      <div className={styles.progress}>{progress === null ? "—" : `${(progress * 100).toFixed(1)}% of £155,000`}</div>
      <div className={styles.shirt}><ProfitShirtMeter value={metric.value} target={MONTHLY_PROFIT_TARGET} targetState={state} /></div>
      {isAboveTarget ? <span className={styles.aboveTarget}>+{((progress - 1) * 100).toFixed(1)}%</span> : null}
      <div className={styles.comparison}>
        {metric.previousYear === null ? <span>No previous-year comparison</span> : <><span>Last year <strong>{currency(metric.previousYear)}</strong></span><ComparisonBadge percentageChange={metric.percentageChange} state={comparisonState} /></>}
      </div>
      </BentoPanel>
    </CardShell>
  );
}
