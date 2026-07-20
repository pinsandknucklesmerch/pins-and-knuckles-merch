import type {
  DashboardKpi,
  DashboardPeriodFixture,
  DashboardSelection,
  DateRange,
  HistoricalDashboardMetrics,
  HistoricalSalesDashboardFixture,
  LeadSourceKpi,
  SalesDashboardKpis,
  SalesLead,
  SalespersonKpi,
} from "../types";

export const DEFAULT_DATE_RANGE: DateRange = {
  from: "2025-10-01",
  to: "2025-10-31",
};

export const MONTHLY_PROFIT_TARGET = 155_000;
export const QUOTES_DONE_TARGET = 300;
export const DEFAULT_DASHBOARD_PERIOD: DashboardPeriodFixture = {
  month: "2026-07",
  monthlyProfit: 0,
  previousYearMonthlyProfit: null,
  quotesDone: 0,
  previousYearQuotesDone: null,
  ordersProcessed: null,
  previousYearOrdersProcessed: null,
};

function safeNumber(value: number | null | undefined) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

export function calculateProgress(value: number | null, target: number | null) {
  if (target === null || !Number.isFinite(target) || target <= 0) return null;
  return (safeNumber(value) / target) * 100;
}

export function calculateDifference(current: number | null, previous: number | null) {
  if (previous === null || !Number.isFinite(previous)) return null;
  return safeNumber(current) - previous;
}

export function calculatePercentageChange(current: number | null, previous: number | null) {
  if (previous === null || !Number.isFinite(previous) || previous === 0) return null;
  return ((safeNumber(current) - previous) / Math.abs(previous)) * 100;
}

function createKpi(
  id: DashboardKpi["id"],
  label: string,
  format: DashboardKpi["format"],
  current: number | null,
  previousYear: number | null,
  target: number | null,
): DashboardKpi {
  return {
    id,
    label,
    format,
    target,
    comparison: {
      current,
      previousYear,
      difference: calculateDifference(current, previousYear),
      percentageChange: calculatePercentageChange(current, previousYear),
    },
  };
}

export function calculateDashboardKpis(period: DashboardPeriodFixture): DashboardKpi[] {
  return [
    createKpi("monthly-profit", "Monthly Profit", "currency", period.monthlyProfit, period.previousYearMonthlyProfit, MONTHLY_PROFIT_TARGET),
    createKpi("quotes-done", "Quotes Done", "number", period.quotesDone, period.previousYearQuotesDone, QUOTES_DONE_TARGET),
    createKpi("orders-processed", "Orders Processed", "number", period.ordersProcessed, period.previousYearOrdersProcessed, null),
  ];
}

export const DEFAULT_DASHBOARD_SELECTION: DashboardSelection = {
  year: 2025,
  month: "October",
};

export function getHistoricalPeriod(
  fixture: HistoricalSalesDashboardFixture,
  selection: DashboardSelection,
): DashboardPeriodFixture {
  const index = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].indexOf(selection.month);
  const current = fixture.years.find((year) => year.year === selection.year);
  const previous = fixture.years.find((year) => year.year === selection.year - 1);
  return {
    month: `${selection.year}-${selection.month}`,
    monthlyProfit: current?.profit[index] ?? null,
    previousYearMonthlyProfit: previous?.profit[index] ?? null,
    quotesDone: current?.enquiries[index] ?? null,
    previousYearQuotesDone: previous?.enquiries[index] ?? null,
    ordersProcessed: null,
    previousYearOrdersProcessed: null,
  };
}

export function calculateHistoricalDashboardMetrics(
  fixture: HistoricalSalesDashboardFixture,
  selection: DashboardSelection,
): HistoricalDashboardMetrics {
  const period = getHistoricalPeriod(fixture, selection);
  const current = fixture.years.find((year) => year.year === selection.year);
  const monthIndex = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].indexOf(selection.month);
  const enquiries = current?.enquiries[monthIndex] ?? null;
  const conversions = current?.conversions[monthIndex] ?? null;
  const salespersonRows = fixture.salespersonYears
    .find((year) => year.year === selection.year)?.months[selection.month] ?? [];
  const salespeople = salespersonRows.map((row, index) => ({
    salespersonId: `${selection.year}-${selection.month}-${index}`,
    salespersonName: row.salespersonName,
    leads: row.enquiries ?? 0,
    conversions: row.conversions ?? 0,
    conversionRate: row.conversionRate ?? calculateConversionRate(row.enquiries ?? 0, row.conversions ?? 0),
    totalProfit: row.totalProfit,
    averageProfitPerJob: row.averageProfitPerJob,
  })).sort((a, b) => a.salespersonName.localeCompare(b.salespersonName));
  return {
    selection,
    kpis: calculateDashboardKpis(period),
    summary: {
      totalLeads: enquiries,
      totalConversions: conversions,
      conversionRate: current?.conversionRates[monthIndex]
        ?? (enquiries === null || conversions === null ? null : calculateConversionRate(enquiries, conversions)),
    },
    salespeople,
    salesInbox: fixture.salesInbox.find((year) => year.year === selection.year) ?? null,
  };
}

function isValidDateInput(value: string | undefined): value is string {
  return Boolean(value && /^\d{4}-\d{2}-\d{2}$/.test(value));
}

export function normaliseDateRange(params: {
  from?: string | string[];
  to?: string | string[];
}): DateRange {
  const from = Array.isArray(params.from) ? params.from[0] : params.from;
  const to = Array.isArray(params.to) ? params.to[0] : params.to;

  if (!isValidDateInput(from) || !isValidDateInput(to) || from > to) {
    return DEFAULT_DATE_RANGE;
  }

  return { from, to };
}

export function filterLeadsByDateRange(
  leads: SalesLead[],
  dateRange: DateRange,
): SalesLead[] {
  return leads.filter(
    (lead) => lead.createdAt >= dateRange.from && lead.createdAt <= dateRange.to,
  );
}

export function calculateConversionRate(
  totalLeads: number,
  totalConversions: number,
): number {
  if (!Number.isFinite(totalLeads) || totalLeads <= 0 || !Number.isFinite(totalConversions)) return 0;

  return Math.round((totalConversions / totalLeads) * 1000) / 10;
}

export function calculateSalespersonKpis(
  leads: SalesLead[],
): SalespersonKpi[] {
  const rows = new Map<string, SalespersonKpi>();

  leads.forEach((lead) => {
    const salespersonId = lead.salespersonId ?? "unassigned";
    const salespersonName = lead.salespersonName || "Unassigned";
    const row = rows.get(salespersonId) ?? {
      salespersonId,
      salespersonName,
      leads: 0,
      conversions: 0,
      conversionRate: 0,
    };

    row.leads += 1;
    if (lead.status === "converted") row.conversions += 1;
    row.conversionRate = calculateConversionRate(row.leads, row.conversions);
    rows.set(salespersonId, row);
  });

  return Array.from(rows.values()).sort((a, b) =>
    a.salespersonName.localeCompare(b.salespersonName) || a.salespersonId.localeCompare(b.salespersonId),
  );
}

export function calculateLeadSourceBreakdown(
  leads: SalesLead[],
): LeadSourceKpi[] {
  const rows = new Map<string, LeadSourceKpi>();

  leads.forEach((lead) => {
    const sourceCategory = lead.sourceCategory || "Unknown";
    const row = rows.get(sourceCategory) ?? {
      sourceCategory,
      leads: 0,
      conversions: 0,
      conversionRate: 0,
    };

    row.leads += 1;
    if (lead.status === "converted") row.conversions += 1;
    row.conversionRate = calculateConversionRate(row.leads, row.conversions);
    rows.set(lead.sourceCategory, row);
  });

  return Array.from(rows.values()).sort((a, b) =>
    a.sourceCategory.localeCompare(b.sourceCategory),
  );
}

export function calculateSalesDashboardKpis(
  leads: SalesLead[],
  dateRange: DateRange,
  period: DashboardPeriodFixture = DEFAULT_DASHBOARD_PERIOD,
): SalesDashboardKpis {
  const filteredLeads = filterLeadsByDateRange(leads, dateRange);
  const totalConversions = filteredLeads.filter(
    (lead) => lead.status === "converted",
  ).length;

  return {
    dateRange,
    leads: filteredLeads,
    summary: {
      totalLeads: filteredLeads.length,
      totalConversions,
      conversionRate: calculateConversionRate(
        filteredLeads.length,
        totalConversions,
      ),
    },
    salespeople: calculateSalespersonKpis(filteredLeads),
    sources: calculateLeadSourceBreakdown(filteredLeads),
    kpis: calculateDashboardKpis(period),
  };
}
