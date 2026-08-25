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
