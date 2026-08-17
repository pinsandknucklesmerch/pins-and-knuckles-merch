import { EmptyState } from "@/components/ui/EmptyState";

import { selectCurrentMonthComparison, formatYearComparisonValue } from "../data/yearComparison";
import type { YearComparisonData, YearComparisonMetric, YearComparisonPoint } from "../domain/types";
import styles from "./CurrentMonthComparisonView.module.css";

type ComparisonMetric = Exclude<YearComparisonMetric, "LEADS">;

const METRICS: Array<{ code: ComparisonMetric; label: string }> = [
  { code: "MONTHLY_PROFIT", label: "Monthly profit" },
  { code: "QUOTES_DONE", label: "Quotes done" },
  { code: "ORDERS_PROCESSED", label: "Orders processed" },
];

function value(point: YearComparisonPoint, metric: ComparisonMetric) {
  const current = metric === "MONTHLY_PROFIT" ? point.monthlyProfit
    : metric === "QUOTES_DONE" ? point.quotesDone
      : point.ordersProcessed;
  return current === null ? "—" : formatYearComparisonValue(current, metric);
}

function PeriodCard({ year, point }: { year: number; point: YearComparisonPoint }) {
  return <article className={styles.periodCard} data-tv-group="current-month-period">
    <h3>{point.label} {year}</h3>
    <dl>
      {METRICS.map((metric) => <div key={metric.code}>
        <dt>{metric.label}</dt>
        <dd>{value(point, metric.code)}</dd>
      </div>)}
    </dl>
  </article>;
}

export function CurrentMonthComparisonView({ comparison, month }: { comparison: YearComparisonData; month: number }) {
  const periods = selectCurrentMonthComparison(comparison, month);
  if (!periods) return <EmptyState title="No comparison data" />;

  return <section className={styles.slide} data-tv-view="current-month-comparison" aria-labelledby="current-month-comparison-title">
    <h2 id="current-month-comparison-title" data-tv-group="current-month-heading">Current Month Comparison</h2>
    <div className={styles.periodGrid}>
      <PeriodCard year={comparison.selectedYear} point={periods.selected} />
      <PeriodCard year={comparison.previousYear} point={periods.previous} />
    </div>
  </section>;
}
