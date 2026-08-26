import type { MetricResult } from "../domain/types";
import { formatAnimatedMetricValue } from "../lib/animatedMetricValue";
import { companyProfitPresentation } from "../lib/companyProfitPresentation";
import { calculateYtdBonusProfit } from "../lib/reportBonusProfit";
import { MonthlyProfitTshirt } from "./MonthlyProfitTshirt";
import styles from "./ProfitPdfReport.module.css";

function currency(value: number | null, fractionDigits = 0) {
  return formatAnimatedMetricValue(value, "currency", fractionDigits, fractionDigits);
}

export function ProfitReportMonthlyProfit({ metric, ytdProfit, reportMonth }: { metric: MetricResult; ytdProfit: number | null; reportMonth: number }) {
  const presentation = companyProfitPresentation(metric);
  const ytdBonusProfit = calculateYtdBonusProfit(ytdProfit, reportMonth);

  return <article className={styles.monthlyProfit}>
    <div className={styles.monthlySummary}>
      <p>Bonus Profit</p>
      <strong>{currency(presentation.current, 2)}</strong>
      <dl>
        <div><dt>YTD Bonus Profit</dt><dd className={`${styles.ytdBonusProfitValue} ${styles.positive}`}>{currency(ytdBonusProfit, 2)}</dd></div>
      </dl>
    </div>
    <div className={styles.monthlyGauge}><MonthlyProfitTshirt value={presentation.current} target={presentation.target} tvMode ariaLabel="Bonus profit target progress." /></div>
  </article>;
}
