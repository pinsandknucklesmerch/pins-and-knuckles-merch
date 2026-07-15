export type SalesLeadStatus = "new" | "qualified" | "converted" | "lost";

export type SalesLead = {
  id: string;
  createdAt: string;
  salespersonId: string;
  salespersonName: string;
  sourceCategory: string;
  status: SalesLeadStatus;
  convertedAt: string | null;
};

export type DateRange = {
  from: string;
  to: string;
};

export type KpiSummary = {
  totalLeads: number;
  totalConversions: number;
  conversionRate: number;
};

export type SalespersonKpi = {
  salespersonId: string;
  salespersonName: string;
  leads: number;
  conversions: number;
  conversionRate: number;
};

export type LeadSourceKpi = {
  sourceCategory: string;
  leads: number;
  conversions: number;
  conversionRate: number;
};

export type SalesDashboardKpis = {
  dateRange: DateRange;
  leads: SalesLead[];
  summary: KpiSummary;
  salespeople: SalespersonKpi[];
  sources: LeadSourceKpi[];
};
