import { comparisonArcFillPercent, comparisonArcRatio } from "../lib/metricDisplay";
import styles from "./ComparisonArcGauge.module.css";

type ComparisonArcGaugeProps = {
  current: number | null;
  previousYear: number | null;
};

export function ComparisonArcGauge({ current, previousYear }: ComparisonArcGaugeProps) {
  const ratio = comparisonArcRatio(current, previousYear);
  const fillPercent = comparisonArcFillPercent(current, previousYear);
  const trend = ratio !== null && ratio > 1 ? styles.above : styles.below;
  const label = current === null
    ? "Sales Inbox Enquiries is unavailable."
    : ratio === null
      ? `Sales Inbox Enquiries is ${current}. No previous-year comparison is available.`
      : `Sales Inbox Enquiries is ${current}, ${fillPercent.toFixed(1)}% of last year's ${previousYear}.`;

  return (
    <svg className={styles.gauge} viewBox="0 0 180 108" role="img" aria-label={label}>
      <title>{label}</title>
      <path className={styles.remainder} d="M24 96A66 66 0 0 1 156 96" pathLength="100" />
      {ratio !== null ? <path className={trend} d="M24 96A66 66 0 0 1 156 96" pathLength="100" strokeDasharray={`${fillPercent} 100`} /> : null}
    </svg>
  );
}
