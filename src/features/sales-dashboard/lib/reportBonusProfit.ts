import { MONTHLY_PROFIT_TARGET } from "./metricDisplay";

/** Keeps the EPCC report's bonus calculation out of the dashboard presentation. */
export function calculateBonusProfit(profit: number | null | undefined, target = MONTHLY_PROFIT_TARGET) {
  if (profit === null || profit === undefined || !Number.isFinite(profit) || !Number.isFinite(target) || target < 0) return null;
  return Math.max(0, profit - target);
}

export function calculateYtdBonusProfit(ytdProfit: number | null | undefined, reportMonthNumber: number) {
  if (!Number.isInteger(reportMonthNumber) || reportMonthNumber < 1 || reportMonthNumber > 12) return null;
  return calculateBonusProfit(ytdProfit, MONTHLY_PROFIT_TARGET * reportMonthNumber);
}
