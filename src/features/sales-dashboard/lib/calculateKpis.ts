import type {
  DateRange,
  LeadSourceKpi,
  SalesDashboardKpis,
  SalesLead,
  SalespersonKpi,
} from "../types";

export const DEFAULT_DATE_RANGE: DateRange = {
  from: "2026-07-01",
  to: "2026-07-31",
};

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
  if (totalLeads === 0) return 0;

  return Math.round((totalConversions / totalLeads) * 1000) / 10;
}

export function calculateSalespersonKpis(
  leads: SalesLead[],
): SalespersonKpi[] {
  const rows = new Map<string, SalespersonKpi>();

  leads.forEach((lead) => {
    const row = rows.get(lead.salespersonId) ?? {
      salespersonId: lead.salespersonId,
      salespersonName: lead.salespersonName,
      leads: 0,
      conversions: 0,
      conversionRate: 0,
    };

    row.leads += 1;
    if (lead.status === "converted") row.conversions += 1;
    row.conversionRate = calculateConversionRate(row.leads, row.conversions);
    rows.set(lead.salespersonId, row);
  });

  return Array.from(rows.values()).sort((a, b) =>
    a.salespersonName.localeCompare(b.salespersonName),
  );
}

export function calculateLeadSourceBreakdown(
  leads: SalesLead[],
): LeadSourceKpi[] {
  const rows = new Map<string, LeadSourceKpi>();

  leads.forEach((lead) => {
    const row = rows.get(lead.sourceCategory) ?? {
      sourceCategory: lead.sourceCategory,
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
  };
}
