"use client";

import { CircleDollarSign, Goal, TrendingUp, Trophy } from "lucide-react";
import { Surface } from "@/components/ui/Surface";
import type { MetricResult } from "../domain/types";
import { formatAnimatedMetricValue } from "../lib/animatedMetricValue";
import { formatPercentagePoints } from "../lib/metricDisplay";
import { AnimatedMetricValue } from "./AnimatedMetricValue";
import { CompanyProfitGauge } from "./CompanyProfitGauge";
import styles from "./CompanyProfitView.module.css";

function currency(value: number | null) { return formatAnimatedMetricValue(value, "currency", 2, 2); }

function ProfitMetric({ label, value, icon: Icon, format = "currency", state = "standard" }: { label: string; value: number | null; icon: typeof CircleDollarSign; format?: "currency" | "percent"; state?: "standard" | "success" }) {
  return <div className={styles.metric} data-state={state}>
    <span className={styles.metricIcon}><Icon aria-hidden="true" /></span>
    <span className={styles.metricLabel}>{label}</span>
    {format === "percent" ? <strong>{formatPercentagePoints(value)}</strong> : <AnimatedMetricValue value={value} format="currency" maximumFractionDigits={2} minimumFractionDigits={2} className={styles.metricValue} />}
  </div>;
}

export function CompanyProfitView({ metric }: { metric: MetricResult }) {
  const progress = metric.targetProgress;
  const target = metric.target !== null && Number.isFinite(metric.target) && metric.target > 0 ? metric.target : null;
  const current = metric.value !== null && Number.isFinite(metric.value) ? metric.value : null;
  const remaining = target !== null && current !== null ? Math.max(target - current, 0) : null;
  const bonus = target !== null && current !== null ? Math.max(current - target, 0) : null;
  const hasReachedTarget = target !== null && current !== null && current >= target;
  const supportingLabel = hasReachedTarget ? "Bonus Profit" : "Remaining to Target";
  const supportingValue = hasReachedTarget ? bonus : remaining;

  return <section className={styles.view} aria-labelledby="company-profit-title">
    <Surface variant="metric" className={styles.heroCard}>
      <div className={styles.mainContent}>
        <div className={styles.summary}>
          <h2 id="company-profit-title">Monthly Company Profit</h2>
          <AnimatedMetricValue value={metric.value} format="currency" maximumFractionDigits={2} minimumFractionDigits={2} className={styles.value} />
          <div className={styles.progress} data-state={hasReachedTarget ? "success" : "warning"}><strong>{progress === null ? "—" : `${progress.toFixed(1)}%`}</strong><span>of target</span></div>
          <dl className={styles.details}>
            <div><dt>Target Profit</dt><dd>{currency(target)}</dd></div>
            <div data-state={hasReachedTarget ? "bonus" : "remaining"}><dt>{supportingLabel}</dt><dd>{currency(supportingValue)}</dd></div>
          </dl>
        </div>
        <div className={styles.gaugePanel}><CompanyProfitGauge value={current} target={target} remaining={remaining} bonus={bonus} /></div>
      </div>
      <div className={styles.metrics} aria-label="Company profit monthly metrics">
        <ProfitMetric label="Company Profit" value={metric.value} icon={CircleDollarSign} />
        <ProfitMetric label="Target Profit" value={metric.target} icon={Goal} />
        <ProfitMetric label="Bonus Profit" value={bonus} icon={Trophy} state={bonus !== null && bonus > 0 ? "success" : "standard"} />
        <ProfitMetric label="Progress" value={progress} icon={TrendingUp} format="percent" state={hasReachedTarget ? "success" : "standard"} />
      </div>
    </Surface>
  </section>;
}
