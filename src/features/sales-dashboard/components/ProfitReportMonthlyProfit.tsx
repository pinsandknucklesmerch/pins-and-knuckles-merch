import type { MetricResult } from "../domain/types";
import { formatAnimatedMetricValue } from "../lib/animatedMetricValue";
import { companyProfitPresentation } from "../lib/companyProfitPresentation";
import { calculateBonusProfit } from "../lib/reportBonusProfit";
import { MonthlyProfitTshirt } from "./MonthlyProfitTshirt";
import styles from "./ProfitPdfReport.module.css";

function currency(value: number | null, fractionDigits = 0) {
  return formatAnimatedMetricValue(value, "currency", fractionDigits, fractionDigits);
}

export function ProfitReportMonthlyProfit({ metric }: { metric: MetricResult }) {
  const presentation = companyProfitPresentation(metric);
  const bonusProfit = calculateBonusProfit(presentation.current);

  return <article className={styles.monthlyProfit}>
    <div className={styles.monthlySummary}>
      <p>Monthly Profit</p>
      <strong>{currency(presentation.current, 2)}</strong>
      <dl>
        <div><dt>Bonus Profit</dt><dd className={`${styles.bonusProfitValue} ${bonusProfit !== null && bonusProfit > 0 ? styles.positive : ""}`}>{currency(bonusProfit, 2)}</dd></div>
      </dl>
    </div>
    <div className={styles.monthlyGauge}><MonthlyProfitTshirt value={presentation.current} target={presentation.target} tvMode /></div>
  </article>;
}
