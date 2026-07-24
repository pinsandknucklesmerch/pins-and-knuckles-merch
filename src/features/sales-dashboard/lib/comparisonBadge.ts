import type { PreviousYearComparisonState } from "./metricDisplay.ts";

export type ComparisonBadgeInput = {
  absoluteChange?: number | null;
  percentageChange?: number | null;
  percentagePointChange?: number | null;
  state: PreviousYearComparisonState;
  absoluteFormat?: "number" | "currency";
};

export type ComparisonBadgeDetails = { icon: "↑" | "↓" | "−"; values: string[]; accessibleLabel: string } | null;

function magnitude(value: number, format: "number" | "currency") {
  const absolute = Math.abs(value);
  return format === "currency"
    ? new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 2 }).format(absolute)
    : absolute.toLocaleString("en-GB", { maximumFractionDigits: 1 });
}

/** Presentation-only formatter. It intentionally never recalculates KPI comparisons. */
export function comparisonBadgeDetails({ absoluteChange = null, percentageChange = null, percentagePointChange = null, state, absoluteFormat = "number" }: ComparisonBadgeInput): ComparisonBadgeDetails {
  if (state === "unavailable") return null;
  const icon = state === "positive" ? "↑" : state === "negative" ? "↓" : "−";
  const values = [
    percentagePointChange === null ? absoluteChange === null ? null : magnitude(absoluteChange, absoluteFormat) : `${Math.abs(percentagePointChange).toFixed(1)} pts`,
    percentageChange === null ? null : `${Math.abs(percentageChange).toFixed(1)}%`,
  ].filter((value): value is string => Boolean(value));
  const direction = state === "positive" ? "Up" : state === "negative" ? "Down" : "No change";
  const accessibleValues = [
    percentagePointChange === null ? absoluteChange === null ? null : magnitude(absoluteChange, absoluteFormat) : `${Math.abs(percentagePointChange).toFixed(1)} percentage points`,
    percentageChange === null ? null : `${Math.abs(percentageChange).toFixed(1)} percent`,
  ].filter((value): value is string => Boolean(value));
  return { icon, values, accessibleLabel: `${direction} ${accessibleValues.join(", ")} versus last year`.replace(/\s+/g, " ").trim() };
}
