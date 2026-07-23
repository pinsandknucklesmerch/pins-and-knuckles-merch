"use client";

import { calculateCompanyMetrics, calculatePreviousDifference, calculatePreviousPercentageChange } from "../domain/calculateDashboardKpis";
import type { CompanyKpiMonth, MetricResult, SalesKpiTargets } from "../domain/types";
import { CombinedKpiCard } from "./CombinedKpiCard";
import { LiveStatus } from "./LiveStatus";
import { ProfitShirtKpi } from "./ProfitShirtKpi";
import { SalesInboxKpi } from "./SalesInboxKpi";
import styles from "./CompanyKpiView.module.css";

function metricByCode(metrics: MetricResult[], code: MetricResult["code"]) {
  const metric = metrics.find((candidate) => candidate.code === code);
  if (!metric) throw new Error(`Missing company metric ${code}.`);
  return metric;
}

function convertedMetric(current: CompanyKpiMonth, previous: CompanyKpiMonth | null): MetricResult {
  const value = current.converted;
  const previousYear = previous?.converted ?? null;
  return {
    code: "SALES_INBOX_ENQUIRIES",
    label: "Converted",
    value,
    previousYear,
    difference: calculatePreviousDifference(value, previousYear),
    percentageChange: calculatePreviousPercentageChange(value, previousYear),
    target: null,
    targetProgress: null,
    targetReached: false,
    format: "number",
  };
}

export function CompanyKpiView({ current, previous, targets }: { current: CompanyKpiMonth; previous: CompanyKpiMonth | null; targets: SalesKpiTargets }) {
  const metrics = calculateCompanyMetrics(current, previous, targets);
  const now = new Date();
  const isCurrentMondayPeriod = current.source === "monday" && current.year === now.getUTCFullYear() && current.month === now.getUTCMonth() + 1;
  const profit = metricByCode(metrics, "MONTHLY_PROFIT");
  const quotes = metricByCode(metrics, "QUOTES_DONE");
  const orders = metricByCode(metrics, "ORDERS_PROCESSED");
  const inbox = metricByCode(metrics, "SALES_INBOX_ENQUIRIES");
  const conversion = metricByCode(metrics, "CONVERSION_RATE");
  const inboxConversion = metricByCode(metrics, "SALES_INBOX_CONVERSION_RATE");

  return (
    <div className="grid gap-2.5">
      {isCurrentMondayPeriod ? <LiveStatus /> : null}
      <div className={styles.grid}>
        <div className={styles.left}>
          <ProfitShirtKpi metric={profit} />
        </div>
        <div className={styles.right}>
          <CombinedKpiCard first={quotes} second={orders} />
          <CombinedKpiCard first={convertedMetric(current, previous)} second={conversion} />
          <SalesInboxKpi enquiries={inbox} conversionRate={inboxConversion} />
        </div>
      </div>
    </div>
  );
}
