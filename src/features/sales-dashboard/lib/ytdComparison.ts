import { calculateConversionRate, calculateSalesInboxConversionRate } from "../domain/calculateDashboardKpis.ts";
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
    const salesInboxPoints = points.filter((point) => point.salesInboxEnquiries !== null && point.converted !== null);
    const converted = salesInboxPoints
      .map((point) => point.converted)
      .filter((value): value is number => value !== null && Number.isFinite(value));
    const enquiries = salesInboxPoints
      .map((point) => point.salesInboxEnquiries)
      .filter((value): value is number => value !== null && Number.isFinite(value));
    return converted.length === 0 || enquiries.length === 0
      ? null
      : calculateSalesInboxConversionRate(converted.reduce((total, value) => total + value, 0), enquiries.reduce((total, value) => total + value, 0));
  }
  return sumYearComparisonMetric(points, code);
}
