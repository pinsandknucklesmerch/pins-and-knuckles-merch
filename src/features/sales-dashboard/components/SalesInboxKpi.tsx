"use client";

import { BentoPanel } from "@/components/ui/BentoPanel";
import type { MetricResult } from "../domain/types";
import { comparisonArcRatio, formatPercentagePoints } from "../lib/metricDisplay";
import { ComparisonArcGauge } from "./ComparisonArcGauge";
import styles from "./SalesInboxKpi.module.css";

function number(value: number | null) {
  return value === null ? "—" : value.toLocaleString("en-GB");
}

function delta(value: number | null) {
  if (value === null) return null;
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toLocaleString("en-GB")}`;
}

function relativeChange(value: number | null) {
  return value === null ? null : `${value > 0 ? "+" : ""}${value.toFixed(1)}%`;
}

function percentagePointDelta(value: number | null) {
  return value === null ? null : `${value > 0 ? "+" : ""}${value.toFixed(1)} pts`;
}

function comparisonTone(value: number | null) {
  return value !== null && value < 0 ? styles.below : styles.above;
}

export function SalesInboxKpi({ enquiries, conversionRate }: { enquiries: MetricResult; conversionRate: MetricResult }) {
  const enquiriesRatio = comparisonArcRatio(enquiries.value, enquiries.previousYear);
  const hasEnquiriesComparison = enquiriesRatio !== null;
  const enquiriesDelta = delta(enquiries.difference);
  const enquiriesChange = relativeChange(enquiries.percentageChange);
  const conversionDelta = percentagePointDelta(conversionRate.difference);
  const conversionChange = relativeChange(conversionRate.percentageChange);

  return (
    <BentoPanel className={styles.card} glow>
      <h2 className={styles.heading}>Sales Inbox</h2>
      <section className={styles.enquiries} aria-labelledby="sales-inbox-enquiries">
        <h3 id="sales-inbox-enquiries" className={styles.label}>Enquiries</h3>
        <div className={styles.arc}>
          <ComparisonArcGauge current={enquiries.value} previousYear={enquiries.previousYear} />
        </div>
        <div className={styles.enquiriesValue}>{number(enquiries.value)}</div>
        {hasEnquiriesComparison ? (
          <div className={styles.reference}>Last year {number(enquiries.previousYear)}</div>
        ) : (
          <div className={styles.reference}>No previous-year comparison</div>
        )}
        {hasEnquiriesComparison && enquiriesDelta && enquiriesChange ? (
          <div className={comparisonTone(enquiries.difference)}>
            {enquiriesDelta} · {enquiriesChange} vs last year
          </div>
        ) : null}
      </section>
      <section className={styles.conversion} aria-labelledby="sales-inbox-conversion-rate">
        <h3 id="sales-inbox-conversion-rate" className={styles.label}>Conversion Rate</h3>
        <div className={styles.conversionValue}>{formatPercentagePoints(conversionRate.value)}</div>
        <div className={styles.conversionComparison}>
          {conversionRate.previousYear === null ? (
            <div className={styles.reference}>No previous-year comparison</div>
          ) : (
            <>
              <div className={styles.reference}>Last year {formatPercentagePoints(conversionRate.previousYear)}</div>
              {conversionDelta && conversionChange ? <div className={comparisonTone(conversionRate.difference)}>{conversionDelta} · {conversionChange} vs last year</div> : null}
            </>
          )}
        </div>
      </section>
    </BentoPanel>
  );
}
