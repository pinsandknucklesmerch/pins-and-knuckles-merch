import { shirtFillPercent } from "../lib/metricDisplay";
import { useId } from "react";
import styles from "./ProfitShirtMeter.module.css";

type ProfitShirtMeterProps = {
  value: number | null;
  target: number;
};

export function ProfitShirtMeter({ value, target }: ProfitShirtMeterProps) {
  const clipId = `profit-shirt-fill-${useId().replace(/:/g, "")}`;
  const fillPercent = shirtFillPercent(value, target);
  const label = value === null ? "Monthly profit is unavailable." : `Monthly profit is ${fillPercent.toFixed(1)}% of target.`;
  const fillHeight = 137 * (fillPercent / 100);

  return (
    <svg className={styles.meter} viewBox="0 0 180 180" role="img" aria-label={label}>
      <title>{label}</title>
      <defs>
        <clipPath id={clipId}>
          <path d="M55 28 75 18c8 8 22 8 30 0l20 10 33 26-18 28-16-12v85H56V70L40 82 22 54l33-26Z" />
        </clipPath>
      </defs>
      <path className={styles.shirtBase} d="M55 28 75 18c8 8 22 8 30 0l20 10 33 26-18 28-16-12v85H56V70L40 82 22 54l33-26Z" />
      <rect className={styles.fill} x="18" y={155 - fillHeight} width="144" height={fillHeight} clipPath={`url(#${clipId})`} />
      <path className={styles.outline} d="M55 28 75 18c8 8 22 8 30 0l20 10 33 26-18 28-16-12v85H56V70L40 82 22 54l33-26Z" />
      <path className={styles.collar} d="M75 18c8 8 22 8 30 0" />
    </svg>
  );
}
