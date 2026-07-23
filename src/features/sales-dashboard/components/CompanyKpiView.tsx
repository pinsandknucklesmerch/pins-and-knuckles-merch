"use client";

import { calculateCompanyMetrics } from "../domain/calculateDashboardKpis";
import type { CompanyKpiMonth, MetricResult, SalesKpiTargets } from "../domain/types";
import { CombinedKpiCard } from "./CombinedKpiCard";
import { MetricGrid } from "metricui";
import { LiveStatus } from "./LiveStatus";
import { ProfitShirtKpi } from "./ProfitShirtKpi";
import { SalesInboxKpi } from "./SalesInboxKpi";
import styles from "./CompanyKpiView.module.css";

function metricByCode(metrics: MetricResult[], code: MetricResult["code"]) {
  const metric = metrics.find((candidate) => candidate.code === code);
  if (!metric) throw new Error(`Missing company metric ${code}.`);
  return metric;
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
      <MetricGrid columns={12} gap={12}>
        <MetricGrid.Item span="full">
          <div className={styles.topRow}>
            <ProfitShirtKpi metric={profit} />
            <SalesInboxKpi enquiries={inbox} conversionRate={inboxConversion} />
          </div>
        </MetricGrid.Item>
        <MetricGrid.Item span="full">
          <CombinedKpiCard first={quotes} second={orders} third={conversion} verticalAlign="center" />
        </MetricGrid.Item>
      </MetricGrid>
    </div>
  );
}
