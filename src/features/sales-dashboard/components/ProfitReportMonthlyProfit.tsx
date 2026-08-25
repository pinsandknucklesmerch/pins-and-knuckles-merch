import type { MetricResult } from "../domain/types";
import { formatAnimatedMetricValue } from "../lib/animatedMetricValue";
import { companyProfitPresentation } from "../lib/companyProfitPresentation";
import { formatPercentagePoints } from "../lib/metricDisplay";
import { CompanyProfitGauge } from "./CompanyProfitGauge";
import styles from "./ProfitPdfReport.module.css";

function currency(value: number | null, fractionDigits = 0) {
  return formatAnimatedMetricValue(value, "currency", fractionDigits, fractionDigits);
}

export function ProfitReportMonthlyProfit({ metric }: { metric: MetricResult }) {
  const presentation = companyProfitPresentation(metric);

  return <article className={styles.monthlyProfit}>
    <div className={styles.monthlySummary}>
      <p>Monthly Profit</p>
      <strong>{currency(presentation.current, 2)}</strong>
      <div className={styles.progress} data-state={presentation.hasReachedTarget ? "success" : "warning"}><b>{formatPercentagePoints(presentation.progress)}</b><span>of target</span></div>
      <dl>
        <div><dt>Target Profit</dt><dd>{currency(presentation.target)}</dd></div>
        {presentation.hasReachedTarget ? <div className={styles.aboveTarget}><dt>Profit Above Target</dt><dd>{currency(presentation.bonus)}</dd></div> : null}
      </dl>
    </div>
    <div className={styles.monthlyGauge}><CompanyProfitGauge value={presentation.current} target={presentation.target} remaining={presentation.remaining} bonus={presentation.bonus} /></div>
  </article>;
}
