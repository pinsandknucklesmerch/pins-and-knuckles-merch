import type { SnuggleMonth } from "../server/snuggleProfit";

export function sortSnuggleMonthsChronologically(months: SnuggleMonth[]) {
  return [...months].sort((a, b) => a.year - b.year || a.month - b.month);
}

export function getSnuggleChartMaxMagnitude(months: SnuggleMonth[]) {
  return Math.max(...months.map((month) => Math.abs(month.total)), 0);
}

export function getSnuggleBarHeight(total: number, maxMagnitude: number) {
  if (maxMagnitude === 0) return 0;
  return (Math.abs(total) / maxMagnitude) * 100;
}

export function formatSnuggleChartMonth(month: SnuggleMonth) {
  return new Intl.DateTimeFormat("en-GB", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(month.year, month.month - 1, 1)));
}
