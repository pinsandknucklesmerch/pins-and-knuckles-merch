import { effectiveCompanyKpiValue, type CompanyKpiMonth, type FinalisableSalesKpiCode, type MetricResult, type SalesKpiTargets } from "./types.ts";

export function calculateConversionRate(converted: number | null, enquiries: number | null): number {
  if (enquiries === null || enquiries <= 0 || converted === null || !Number.isFinite(converted)) return 0;
  return Math.round((converted / enquiries) * 1000) / 10;
}

export function calculateTargetProgress(value: number | null, target: number | null): number | null {
  if (value === null || target === null || !Number.isFinite(target) || target <= 0) return null;
  return Math.round((value / target) * 1000) / 10;
}

export function calculatePreviousDifference(current: number | null, previous: number | null): number | null {
  return current === null || previous === null ? null : current - previous;
}

export function calculatePreviousPercentageChange(current: number | null, previous: number | null): number | null {
  if (current === null || previous === null || previous === 0) return null;
  return Math.round(((current - previous) / Math.abs(previous)) * 1000) / 10;
}

export function isTargetReached(value: number | null, target: number | null): boolean {
  return value !== null && target !== null && value >= target;
}

function metric(
  code: MetricResult["code"], label: string, value: number | null, previous: number | null,
  target: number | null, format: MetricResult["format"],
): MetricResult {
  return {
    code, label, value, previousYear: previous,
    difference: calculatePreviousDifference(value, previous),
    percentageChange: calculatePreviousPercentageChange(value, previous),
  target, targetProgress: calculateTargetProgress(value, target),
    targetReached: isTargetReached(value, target), format,
  };
}

export function calculateCompanyMetrics(
  current: CompanyKpiMonth,
  previous: CompanyKpiMonth | null,
  targets: SalesKpiTargets,
): MetricResult[] {
  const currentProfit = effectiveCompanyKpiValue(current, "MONTHLY_PROFIT");
  const currentQuotes = effectiveCompanyKpiValue(current, "QUOTES_DONE");
  const currentOrders = effectiveCompanyKpiValue(current, "ORDERS_PROCESSED");
  const previousProfit = previous ? effectiveCompanyKpiValue(previous, "MONTHLY_PROFIT") : null;
  const previousQuotes = previous ? effectiveCompanyKpiValue(previous, "QUOTES_DONE") : null;
  const previousOrders = previous ? effectiveCompanyKpiValue(previous, "ORDERS_PROCESSED") : null;
  const currentConversion = calculateConversionRate(currentOrders, currentQuotes);
  const previousConversion = calculateConversionRate(previousOrders, previousQuotes);
  const currentInboxConversion = calculateConversionRate(current.converted, current.salesInboxEnquiries);
  const previousInboxConversion = previous ? calculateConversionRate(previous.converted, previous.salesInboxEnquiries) : null;
  return [
    { ...metric("MONTHLY_PROFIT", "Monthly Profit", currentProfit, previousProfit, targets.MONTHLY_PROFIT ?? null, "currency"), calculatedValue: current.monthlyProfit, finalValue: current.finalValues?.MONTHLY_PROFIT?.value, isFinal: current.finalValues?.MONTHLY_PROFIT !== undefined },
    { ...metric("QUOTES_DONE", "Quotes Done", currentQuotes, previousQuotes, targets.QUOTES_DONE ?? null, "number"), calculatedValue: current.quotesDone, finalValue: current.finalValues?.QUOTES_DONE?.value, isFinal: current.finalValues?.QUOTES_DONE !== undefined },
    { ...metric("ORDERS_PROCESSED", "Orders Processed", currentOrders, previousOrders, targets.ORDERS_PROCESSED ?? null, "number"), calculatedValue: current.ordersProcessed, finalValue: current.finalValues?.ORDERS_PROCESSED?.value, isFinal: current.finalValues?.ORDERS_PROCESSED !== undefined },
    { ...metric("PK_TAX" as FinalisableSalesKpiCode, "PK Tax", effectiveCompanyKpiValue(current, "PK_TAX"), previous ? effectiveCompanyKpiValue(previous, "PK_TAX") : null, null, "currency"), calculatedValue: current.monthlyPkTax ?? null, finalValue: current.finalValues?.PK_TAX?.value, isFinal: current.finalValues?.PK_TAX !== undefined },
    metric("SALES_INBOX_ENQUIRIES", "Active Marketing Enquiries", current.salesInboxEnquiries, previous?.salesInboxEnquiries ?? null, null, "number"),
    metric("CONVERSION_RATE", "Conversion Rate", currentConversion, previousConversion, targets.CONVERSION_RATE ?? null, "percent"),
    metric("SALES_INBOX_CONVERSION_RATE", "Sales Inbox Conversion Rate", currentInboxConversion, previousInboxConversion, null, "percent"),
  ];
}
