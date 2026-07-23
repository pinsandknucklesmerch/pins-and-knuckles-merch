import type { PreviousYearComparisonState } from "../lib/metricDisplay";
import { comparisonBadgeDetails } from "../lib/comparisonBadge";
import styles from "./ComparisonBadge.module.css";

type ComparisonBadgeProps = {
  absoluteChange?: number | null;
  percentageChange?: number | null;
  percentagePointChange?: number | null;
  state: PreviousYearComparisonState;
  absoluteFormat?: "number" | "currency";
  contextLabel?: string;
  accessibleLabel?: string;
};

export function ComparisonBadge({ contextLabel = "vs last year", accessibleLabel, ...input }: ComparisonBadgeProps) {
  const details = comparisonBadgeDetails(input);
  if (!details) return null;
  return (
    <span className={styles.wrap}>
      <span className={`${styles.badge} ${styles[input.state]}`} aria-label={accessibleLabel ?? details.accessibleLabel}>
        <span aria-hidden="true" className={styles.icon}>{details.icon}</span>
        <span>{details.values.join(" · ")}</span>
      </span>
      {contextLabel ? <span className={styles.context}>{contextLabel}</span> : null}
    </span>
  );
}
