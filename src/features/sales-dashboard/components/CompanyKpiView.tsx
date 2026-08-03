"use client";

import { MetricGrid } from "metricui";
import type { CSSProperties } from "react";
import type { CompanyKpiMonth, MetricResult } from "../domain/types";
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

export function CompanyKpiView({ current, metrics, gaugeAnimationKey, gaugeAnimationDelayMs, gaugeInteractive = true, tvMode = false }: { current: CompanyKpiMonth; metrics: MetricResult[]; gaugeAnimationKey?: string | number; gaugeAnimationDelayMs?: number; gaugeInteractive?: boolean; tvMode?: boolean }) {
  const now = new Date();
  const isCurrentMondayPeriod = current.source === "monday" && current.year === now.getUTCFullYear() && current.month === now.getUTCMonth() + 1;
  const profit = metricByCode(metrics, "MONTHLY_PROFIT");
  const quotes = metricByCode(metrics, "QUOTES_DONE");
  const orders = metricByCode(metrics, "ORDERS_PROCESSED");
  const inbox = metricByCode(metrics, "SALES_INBOX_ENQUIRIES");
  const conversion = metricByCode(metrics, "CONVERSION_RATE");
  const inboxConversion = metricByCode(metrics, "SALES_INBOX_CONVERSION_RATE");

  return (
    <div className="grid gap-2.5" data-tv-view={tvMode ? "overview" : undefined}>
      {isCurrentMondayPeriod ? <LiveStatus /> : null}
      <MetricGrid columns={12} gap={12}>
        <MetricGrid.Item span="full">
          <div className={styles.topRow}>
            <div className={`${styles.tvGroup} ${tvMode ? styles.tvGroupTv : ""}`} data-tv-group={tvMode ? "overview-profit" : undefined} style={tvMode ? { "--tv-enter-index": 0 } as CSSProperties : undefined}>
              <ProfitShirtKpi metric={profit} />
            </div>
            <div className={`${styles.tvGroup} ${tvMode ? styles.tvGroupTv : ""}`} data-tv-group={tvMode ? "overview-inbox" : undefined} style={tvMode ? { "--tv-enter-index": 4 } as CSSProperties : undefined}>
              <SalesInboxKpi enquiries={inbox} conversionRate={inboxConversion} />
            </div>
          </div>
        </MetricGrid.Item>
        <MetricGrid.Item span="full">
          <CombinedKpiCard first={quotes} second={orders} third={conversion} gaugeAnimationKey={gaugeAnimationKey} gaugeAnimationDelayMs={gaugeAnimationDelayMs} gaugeInteractive={gaugeInteractive} />
        </MetricGrid.Item>
      </MetricGrid>
    </div>
  );
}
