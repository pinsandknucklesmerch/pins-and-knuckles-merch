import type { YearComparisonData, YearComparisonMetric } from "../domain/types.ts";
import { yearComparisonValue } from "../data/yearComparison.ts";
import { chartValue } from "./chartValue.ts";

export type YtdChartPoint = { label: string; current: number | null; previous: number | null };

/** Builds the bounded monthly series used by both the YTD dashboard and EPCC report. */
export function ytdChartPoints(comparison: YearComparisonData, cutoffMonth: number, code: YearComparisonMetric): YtdChartPoint[] {
  return comparison.selected.map((point) => {
    const previousPoint = comparison.previous.find((candidate) => candidate.month === point.month);
    return {
      label: point.label,
      current: chartValue(point.month <= cutoffMonth ? yearComparisonValue(point, code) : null),
      previous: chartValue(previousPoint ? yearComparisonValue(previousPoint, code) : null),
    };
  });
}
