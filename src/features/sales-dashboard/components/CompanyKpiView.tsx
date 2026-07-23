"use client";

import { calculateCompanyMetrics, calculatePreviousDifference, calculatePreviousPercentageChange } from "../domain/calculateDashboardKpis";
import type { CompanyKpiMonth, MetricResult, SalesKpiTargets } from "../domain/types";
import { MetricKpiCard } from "./MetricKpiCard";
import { ProfitShirtKpi } from "./ProfitShirtKpi";
import { SalesInboxComparisonKpi } from "./SalesInboxComparisonKpi";

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
    <div className="grid gap-3">
      {isCurrentMondayPeriod ? <p className="text-xs text-amber-300">Current month · non-final</p> : null}
      <div className="grid gap-3 lg:grid-cols-4">
        <div className="min-w-0 lg:col-span-2"><ProfitShirtKpi metric={profit} /></div>
        <div className="min-w-0"><MetricKpiCard metric={quotes} /></div>
        <div className="min-w-0"><MetricKpiCard metric={orders} /></div>
        <div className="grid min-w-0 gap-3 sm:grid-cols-2 lg:col-span-4 lg:grid-cols-4">
          <SalesInboxComparisonKpi metric={inbox} />
          <MetricKpiCard metric={convertedMetric(current, previous)} />
          <MetricKpiCard metric={conversion} />
          <MetricKpiCard metric={inboxConversion} />
        </div>
      </div>
    </div>
  );
}
