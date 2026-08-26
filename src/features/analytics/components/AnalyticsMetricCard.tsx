import { AnalyticsSparkline } from "./AnalyticsSparkline";
import styles from "./AnalyticsMetricCard.module.css";

type AnalyticsMetricCardProps = { label: string; value: string; change: { value: string; tone: "positive" | "negative" | "neutral" } | null; trend: number[] };

export function AnalyticsMetricCard({ label, value, change, trend }: AnalyticsMetricCardProps) {
  return <article className={styles.card}>
    <div className={styles.summary}><span>{label}</span><strong>{value}</strong><small className={change ? styles[change.tone] : undefined}>{change?.value ?? "—"}</small></div>
    <div className={styles.sparkline}><AnalyticsSparkline label={label} values={trend} /></div>
  </article>;
}
