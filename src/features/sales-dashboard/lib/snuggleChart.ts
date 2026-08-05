import type { SnuggleMonth } from "./snuggleProfit.ts";

export function sortSnuggleMonthsChronologically(months: SnuggleMonth[]) {
  return [...months].sort((a, b) => a.year - b.year || a.month - b.month);
}

export function formatSnuggleChartMonth(month: SnuggleMonth) {
  return new Intl.DateTimeFormat("en-GB", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(month.year, month.month - 1, 1)));
}

export function buildSnuggleChartData(months: SnuggleMonth[]) {
  return sortSnuggleMonthsChronologically(months).map((month) => ({
    month: formatSnuggleChartMonth(month),
    profit: month.total,
  }));
}

export function resolveSelectedSnuggleMonth(months: SnuggleMonth[], year: number, month: number) {
  return months.find((candidate) => candidate.year === year && candidate.month === month) ?? null;
}
