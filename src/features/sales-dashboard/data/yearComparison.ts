import { calculateConversionRate } from "../domain/calculateDashboardKpis";
import type { CompanyKpiMonth, YearComparisonData, YearComparisonMetric, YearComparisonPoint } from "../domain/types";

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"] as const;

function point(month: CompanyKpiMonth): YearComparisonPoint {
  return {
    month: month.month,
    label: MONTH_LABELS[month.month - 1],
    monthlyProfit: month.monthlyProfit,
    quotesDone: month.quotesDone,
    ordersProcessed: month.ordersProcessed,
    // No distinct company-level Leads field exists in the canonical dashboard model.
    leads: null,
    converted: month.converted,
    conversionRate: calculateConversionRate(month.ordersProcessed, month.quotesDone),
    salesInboxEnquiries: month.salesInboxEnquiries,
    salesInboxConversionRate: calculateConversionRate(month.converted, month.salesInboxEnquiries),
  };
}

export function buildYearComparison(selectedYear: number, selected: CompanyKpiMonth[], previous: CompanyKpiMonth[]): YearComparisonData {
  return { selectedYear, previousYear: selectedYear - 1, selected: selected.map(point), previous: previous.map(point) };
}

export function yearComparisonValue(point: YearComparisonPoint, metric: YearComparisonMetric) {
  switch (metric) {
    case "MONTHLY_PROFIT": return point.monthlyProfit;
    case "QUOTES_DONE": return point.quotesDone;
    case "ORDERS_PROCESSED": return point.ordersProcessed;
    case "LEADS": return point.leads;
    case "CONVERTED": return point.converted;
    case "CONVERSION_RATE": return point.conversionRate;
    case "SALES_INBOX_ENQUIRIES": return point.salesInboxEnquiries;
    case "SALES_INBOX_CONVERSION_RATE": return point.salesInboxConversionRate;
  }
}

export function formatYearComparisonValue(value: number, metric: YearComparisonMetric) {
  if (metric === "MONTHLY_PROFIT") return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(value);
  if (metric === "CONVERSION_RATE" || metric === "SALES_INBOX_CONVERSION_RATE") return `${value.toFixed(1)}%`;
  return value.toLocaleString("en-GB");
}
