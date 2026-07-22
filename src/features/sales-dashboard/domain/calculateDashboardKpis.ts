import type { CompanyKpiMonth, MetricResult, SalesKpiTargets } from "./types.ts";

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
  const currentScopeALeads = current.mondayScopeALeads ?? current.salesInboxEnquiries;
  const currentScopeAConverted = current.mondayScopeAConverted ?? current.converted;
  const currentConversion = current.mondayScopeAConversionRate ?? calculateConversionRate(current.converted, current.salesInboxEnquiries);
  const previousScopeALeads = previous ? (previous.mondayScopeALeads ?? previous.salesInboxEnquiries) : null;
  const previousScopeAConverted = previous ? (previous.mondayScopeAConverted ?? previous.converted) : null;
  const previousConversion = previous ? (previous.mondayScopeAConversionRate ?? calculateConversionRate(previous.converted, previous.salesInboxEnquiries)) : null;
  const currentInboxConversion = calculateConversionRate(current.converted, current.salesInboxEnquiries);
  const previousInboxConversion = previous ? calculateConversionRate(previous.converted, previous.salesInboxEnquiries) : null;
  return [
    metric("MONTHLY_PROFIT", "Monthly Profit", current.monthlyProfit, previous?.monthlyProfit ?? null, targets.MONTHLY_PROFIT ?? null, "currency"),
    metric("QUOTES_DONE", "Quotes Done", current.quotesDone, previous?.quotesDone ?? null, targets.QUOTES_DONE ?? null, "number"),
    metric("ORDERS_PROCESSED", "Orders Processed", current.ordersProcessed, previous?.ordersProcessed ?? null, targets.ORDERS_PROCESSED ?? null, "number"),
    metric("LEADS", "Leads", currentScopeALeads, previousScopeALeads, null, "number"),
    metric("CONVERTED", "Converted", currentScopeAConverted, previousScopeAConverted, null, "number"),
    metric("SALES_INBOX_ENQUIRIES", "Sales Inbox Enquiries", current.salesInboxEnquiries, previous?.salesInboxEnquiries ?? null, null, "number"),
    metric("CONVERSION_RATE", "Conversion Rate", currentConversion, previousConversion, targets.CONVERSION_RATE ?? null, "percent"),
    metric("SALES_INBOX_CONVERSION_RATE", "Sales Inbox Conversion Rate", currentInboxConversion, previousInboxConversion, null, "percent"),
  ];
}
