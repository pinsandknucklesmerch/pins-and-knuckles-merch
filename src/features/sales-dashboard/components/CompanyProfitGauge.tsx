import { formatAnimatedMetricValue } from "../lib/animatedMetricValue";
import styles from "./CompanyProfitGauge.module.css";

type CompanyProfitGaugeProps = {
  value: number | null;
  target: number | null;
  remaining: number | null;
  bonus: number | null;
};

const TARGET_POSITION = 0.5;

function currency(value: number | null, fractionDigits = 0) {
  return formatAnimatedMetricValue(value, "currency", fractionDigits, fractionDigits);
}

/** The neutral post-target section keeps the target as a fixed gauge landmark. */
export function CompanyProfitGauge({ value, target, remaining, bonus }: CompanyProfitGaugeProps) {
  const validTarget = target !== null && Number.isFinite(target) && target > 0;
  const progress = validTarget && value !== null && Number.isFinite(value) ? Math.min(1, Math.max(0, value / target)) : 0;
  const completedArc = progress * TARGET_POSITION * 100;
  const isBonus = bonus !== null && bonus > 0;
  const centreValue = isBonus ? bonus : remaining;
  const centreLabel = isBonus ? "Bonus profit" : "to target";

  return <div className={styles.gauge} role="img" aria-label={`Monthly company profit ${currency(value)}, target ${currency(target)}`}>
    <svg viewBox="0 0 620 326" className={styles.svg} aria-hidden="true" focusable="false">
      <path className={styles.track} d="M 76 270 A 234 234 0 0 1 544 270" pathLength="100" />
      <path className={styles.fill} d="M 76 270 A 234 234 0 0 1 544 270" pathLength="100" strokeDasharray={`${completedArc} 100`} />
      {validTarget ? <>
        <line className={styles.marker} x1="310" y1="42" x2="310" y2="82" />
        <text className={styles.targetAmount} x="310" y="22">{currency(target)}</text>
        <text className={styles.targetLabel} x="310" y="38">Target</text>
      </> : null}
      <text className={styles.minimum} x="61" y="301">£0</text>
    </svg>
    <div className={styles.centre}>
      <strong>{currency(centreValue)}</strong>
      <span>{centreLabel}</span>
      {isBonus ? <em>Target exceeded</em> : null}
    </div>
  </div>;
}
