import { calculateConversionRate } from "../domain/calculateDashboardKpis.ts";
import type { YearComparisonMetric, YearComparisonPoint } from "../domain/types.ts";
import { yearComparisonValue } from "../data/yearComparison.ts";

export type YtdComparisonMetric = Exclude<YearComparisonMetric, "LEADS" | "MONTHLY_PROFIT">;

export function sumYearComparisonMetric(points: YearComparisonPoint[], code: YearComparisonMetric): number | null {
  const values = points
    .map((point) => yearComparisonValue(point, code))
    .filter((value): value is number => value !== null && Number.isFinite(value));
  return values.length ? values.reduce((total, value) => total + value, 0) : null;
}

export function ytdComparisonValue(points: YearComparisonPoint[], code: YtdComparisonMetric): number | null {
  if (code === "CONVERSION_RATE") {
    const orders = sumYearComparisonMetric(points, "ORDERS_PROCESSED");
    const quotes = sumYearComparisonMetric(points, "QUOTES_DONE");
    return orders === null || quotes === null ? null : calculateConversionRate(orders, quotes);
  }
  if (code === "SALES_INBOX_CONVERSION_RATE") {
    const converted = sumYearComparisonMetric(points, "CONVERTED");
    const enquiries = sumYearComparisonMetric(points, "SALES_INBOX_ENQUIRIES");
    return converted === null || enquiries === null ? null : calculateConversionRate(converted, enquiries);
  }
  return sumYearComparisonMetric(points, code);
}
