export type SalesKpiDataSource = "manual" | "historical_fixture" | "monday" | "epcc_email";
export type SalesMetricCode = "MONTHLY_PROFIT" | "QUOTES_DONE" | "ORDERS_PROCESSED" | "CONVERSION_RATE";

export type CompanyKpiMonth = {
  year: number;
  month: number;
  monthlyProfit: number | null;
  quotesDone: number | null;
  ordersProcessed: number | null;
  salesInboxEnquiries: number | null;
  converted: number | null;
  mondaySyncMetadata: { sourceBoardId: string; fetchedAt: string } | null;
  notes: string | null;
  source: SalesKpiDataSource;
};

export type TeamMemberKpiMonth = {
  year: number;
  month: number;
  teamMemberKey: string;
  teamMemberName: string;
  quotesDone: number | null;
  ordersProcessed: number | null;
  salesInboxEnquiries: number | null;
  converted: number | null;
  profit: number | null;
  source: SalesKpiDataSource;
};

export type SalesKpiTargets = Partial<Record<SalesMetricCode, number>>;

export const DEFAULT_SALES_KPI_TARGETS: SalesKpiTargets = {
  MONTHLY_PROFIT: 155_000,
  QUOTES_DONE: 300,
  ORDERS_PROCESSED: 200,
  CONVERSION_RATE: 65,
};

export type MetricResult = {
  code: SalesMetricCode | "SALES_INBOX_ENQUIRIES" | "SALES_INBOX_CONVERSION_RATE";
  label: string;
  value: number | null;
  previousYear: number | null;
  difference: number | null;
  percentageChange: number | null;
  target: number | null;
  targetProgress: number | null;
  targetReached: boolean;
  format: "currency" | "number" | "percent";
};

export type MemberDashboardRow = TeamMemberKpiMonth & {
  conversionRate: number;
  previousYear: TeamMemberKpiMonth | null;
};

export type SalesDashboardData = {
  company: CompanyKpiMonth;
  previousCompany: CompanyKpiMonth | null;
  members: MemberDashboardRow[];
  targets: SalesKpiTargets;
  availableYears: number[];
  setupIssue: string | null;
};
