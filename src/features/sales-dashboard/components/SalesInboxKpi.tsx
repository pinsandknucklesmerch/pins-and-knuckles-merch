"use client";

import { BentoPanel } from "@/components/ui/BentoPanel";
import type { MetricResult } from "../domain/types";
import { comparisonArcRatio, formatPercentagePoints, previousYearComparisonState } from "../lib/metricDisplay";
import { ComparisonArcGauge } from "./ComparisonArcGauge";
import { ComparisonBadge } from "./ComparisonBadge";
import styles from "./SalesInboxKpi.module.css";

function number(value: number | null) {
  return value === null ? "—" : value.toLocaleString("en-GB");
}

export function SalesInboxKpi({ enquiries, conversionRate }: { enquiries: MetricResult; conversionRate: MetricResult }) {
  const enquiriesRatio = comparisonArcRatio(enquiries.value, enquiries.previousYear);
  const hasEnquiriesComparison = enquiriesRatio !== null;

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
        {hasEnquiriesComparison ? <ComparisonBadge absoluteChange={enquiries.difference} percentageChange={enquiries.percentageChange} state={previousYearComparisonState(enquiries.value, enquiries.previousYear)} /> : null}
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
              <ComparisonBadge percentagePointChange={conversionRate.difference} percentageChange={conversionRate.percentageChange} state={previousYearComparisonState(conversionRate.value, conversionRate.previousYear)} />
            </>
          )}
        </div>
      </section>
    </BentoPanel>
  );
}
