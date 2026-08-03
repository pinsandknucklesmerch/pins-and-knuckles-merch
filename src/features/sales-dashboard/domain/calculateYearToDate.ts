import { effectiveCompanyKpiValue, type CompanyKpiMonth, type YearToDateData } from "./types.ts";

const roundCurrency = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;

export function calculateYearToDate(year: number, cutoffMonth: number, rows: Array<CompanyKpiMonth | null>, monthlyTargets: Array<number | null>): YearToDateData {
  const includedMonths = Array.from({ length: cutoffMonth }, (_, index) => index + 1);
  const byMonth = new Map(rows.filter((row): row is CompanyKpiMonth => Boolean(row)).map((row) => [row.month, row]));
  const monthlyProfit = (month: number) => { const row = byMonth.get(month); return row ? effectiveCompanyKpiValue(row, "MONTHLY_PROFIT") : null; };
  const missingMonths = includedMonths.filter((month) => monthlyProfit(month) === null);
  const actuals = includedMonths.map(monthlyProfit);
  const availableActuals = actuals.filter((value): value is number => value !== null);
  const targets = Array.from({ length: 12 }, (_, index) => monthlyTargets[index] ?? null);
  const ytdTargets = targets.slice(0, cutoffMonth);
  const ytdActual = availableActuals.length ? roundCurrency(availableActuals.reduce((sum, value) => sum + value, 0)) : null;
  const ytdTarget = ytdTargets.every((value): value is number => value !== null) ? roundCurrency(ytdTargets.reduce((sum, value) => sum + value, 0)) : null;
  const annualTarget = targets.every((value): value is number => value !== null) ? roundCurrency(targets.reduce((sum, value) => sum + value, 0)) : null;
  let runningActual = 0;
  let actualGap = false;
  const cumulativeActualByMonth = Array.from({ length: 12 }, (_, index) => {
    if (index >= cutoffMonth || actualGap || actuals[index] === null) { actualGap = actualGap || index < cutoffMonth; return null; }
    runningActual = roundCurrency(runningActual + actuals[index]!);
    return runningActual;
  });
  let runningTarget = 0;
  let targetGap = false;
  const cumulativeTargetByMonth = targets.map((target) => {
    if (targetGap || target === null) { targetGap = true; return null; }
    runningTarget = roundCurrency(runningTarget + target);
    return runningTarget;
  });
  return {
    selectedYear: year, cutoffMonth, includedMonths, missingMonths, isComplete: missingMonths.length === 0,
    ytdActual, ytdTarget, variance: ytdActual === null || ytdTarget === null ? null : roundCurrency(ytdActual - ytdTarget),
    achievementRate: ytdActual === null || ytdTarget === null || ytdTarget === 0 ? null : (ytdActual / ytdTarget) * 100,
    annualTarget,
    projectedYearEnd: availableActuals.length ? roundCurrency((availableActuals.reduce((sum, value) => sum + value, 0) / availableActuals.length) * 12) : null,
    cumulativeActualByMonth, cumulativeTargetByMonth,
  };
}
