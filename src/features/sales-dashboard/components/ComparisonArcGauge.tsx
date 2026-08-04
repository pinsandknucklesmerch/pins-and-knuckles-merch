import type { CSSProperties } from "react";
import { comparisonArcFillPercent, comparisonArcRatio } from "../lib/metricDisplay";
import styles from "./ComparisonArcGauge.module.css";

type ComparisonArcGaugeProps = {
  current: number | null;
  previousYear: number | null;
  animationKey?: string | number;
  animationDelayMs?: number;
};

export function ComparisonArcGauge({ current, previousYear, animationKey, animationDelayMs = 0 }: ComparisonArcGaugeProps) {
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
      {ratio !== null ? <path key={animationKey} className={`${trend} ${animationKey !== undefined ? styles.animated : ""}`} style={{ "--arc-progress": fillPercent, "--arc-animation-delay": `${animationDelayMs}ms` } as CSSProperties} d="M24 96A66 66 0 0 1 156 96" pathLength="100" /> : null}
    </svg>
  );
}
