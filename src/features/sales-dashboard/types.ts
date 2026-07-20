export type SalesLeadStatus = "new" | "qualified" | "converted" | "lost";

export type SalesLead = {
  id: string;
  createdAt: string;
  salespersonId: string | null;
  salespersonName: string;
  sourceCategory: string;
  status: SalesLeadStatus;
  convertedAt: string | null;
};

export type DashboardDateRange = {
  from: string;
  to: string;
};

export type DateRange = DashboardDateRange;

export type KpiComparison = {
  current: number | null;
  previousYear: number | null;
  difference: number | null;
  percentageChange: number | null;
};

export type DashboardKpi = {
  id: "monthly-profit" | "quotes-done" | "orders-processed";
  label: string;
  format: "currency" | "number";
  comparison: KpiComparison;
  target: number | null;
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
  totalProfit?: number | null;
  averageProfitPerJob?: number | null;
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
  kpis: DashboardKpi[];
};

export type DashboardPeriodFixture = {
  month: string;
  monthlyProfit: number | null;
  previousYearMonthlyProfit: number | null;
  quotesDone: number | null;
  previousYearQuotesDone: number | null;
  ordersProcessed: number | null;
  previousYearOrdersProcessed: number | null;
};

export const DASHBOARD_MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
] as const;

export type DashboardMonth = (typeof DASHBOARD_MONTHS)[number];

export type HistoricalYearData = {
  year: number;
  enquiries: Array<number | null>;
  conversions: Array<number | null>;
  conversionRates: Array<number | null>;
  profit: Array<number | null>;
};

export type SalespersonMonthlyMetric = {
  salespersonName: string;
  enquiries: number | null;
  conversions: number | null;
  conversionRate: number | null;
  totalProfit: number | null;
  averageProfitPerJob: number | null;
};

export type SalesInboxYearData = {
  year: number;
  enquiries: Array<number | null>;
  conversions: Array<number | null>;
  conversionRates: Array<number | null>;
};

export type HistoricalSalesDashboardFixture = {
  years: HistoricalYearData[];
  salespersonYears: Array<{
    year: number;
    months: Partial<Record<DashboardMonth, SalespersonMonthlyMetric[]>>;
  }>;
  salesInbox: SalesInboxYearData[];
};

export type DashboardSelection = {
  year: number;
  month: DashboardMonth;
};

export type HistoricalDashboardMetrics = {
  selection: DashboardSelection;
  kpis: DashboardKpi[];
  summary: {
    totalLeads: number | null;
    totalConversions: number | null;
    conversionRate: number | null;
  };
  salespeople: SalespersonKpi[];
  salesInbox: SalesInboxYearData | null;
};

export type SalesDashboardFixture = {
  periods: DashboardPeriodFixture[];
  leads: SalesLead[];
  historical: HistoricalSalesDashboardFixture;
};
