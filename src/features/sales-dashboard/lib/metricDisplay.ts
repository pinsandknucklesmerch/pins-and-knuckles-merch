import type { FormatOption } from "metricui";
import type { MetricResult } from "../domain/types";

export const MONTHLY_PROFIT_TARGET = 155_000;

export type TargetState = "no-target" | "below-target" | "target-met";
export type PreviousYearComparisonState = "unavailable" | "negative" | "neutral" | "positive";

export const percentFormat: FormatOption = {
  style: "percent",
  precision: 1,
};

/** Dashboard conversion metrics are stored as percentage points (25 means 25.0%). */
export function formatPercentagePoints(value: number | null) {
  return value === null || !Number.isFinite(value) ? "—" : `${value.toFixed(1)}%`;
}

export function metricFormat(metric: MetricResult): FormatOption {
  if (metric.format === "currency") return { style: "currency", compact: false, precision: 2 };
  if (metric.format === "percent") return percentFormat;
  return { style: "number", compact: false, precision: 0 };
}

export function metricComparison(metric: MetricResult) {
  return metric.previousYear === null ? undefined : { value: metric.previousYear, label: "Last year", mode: "both" as const };
}

export function profitProgress(value: number | null, target: number) {
  return value === null || target <= 0 ? null : value / target;
}

export function targetState(value: number | null, target: number | null): TargetState {
  if (target === null || !Number.isFinite(target) || target <= 0) return "no-target";
  if (value === null || !Number.isFinite(value)) return "below-target";
  return value >= target ? "target-met" : "below-target";
}

export function previousYearComparisonState(value: number | null, previousYear: number | null): PreviousYearComparisonState {
  if (value === null || previousYear === null) return "unavailable";
  if (value > previousYear) return "positive";
  if (value < previousYear) return "negative";
  return "neutral";
}

export function shirtFillPercent(value: number | null, target: number) {
  const progress = profitProgress(value, target);
  return progress === null ? 0 : Math.min(100, Math.max(0, progress * 100));
}

export function comparisonArcRatio(current: number | null, previousYear: number | null) {
  return current === null || previousYear === null || previousYear <= 0 ? null : current / previousYear;
}

export function comparisonArcFillPercent(current: number | null, previousYear: number | null) {
  const ratio = comparisonArcRatio(current, previousYear);
  return ratio === null ? 0 : Math.min(100, Math.max(0, ratio * 100));
}
