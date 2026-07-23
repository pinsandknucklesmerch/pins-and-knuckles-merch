"use client";

import { KpiCard } from "metricui";
import type { MetricResult } from "../domain/types";
import { metricComparison, metricFormat } from "../lib/metricDisplay";
import styles from "./MetricDashboardProvider.module.css";

export function MetricKpiCard({ metric }: { metric: MetricResult }) {
  return (
    <KpiCard
      title={metric.label}
      value={metric.value}
      format={metricFormat(metric)}
      comparison={metricComparison(metric)}
      goal={metric.target === null ? undefined : { value: metric.target, showProgress: true, showTarget: true, completeColor: "#6fc49a" }}
      nullDisplay="dash"
      animate
      className={styles.kpiCard}
    />
  );
}
