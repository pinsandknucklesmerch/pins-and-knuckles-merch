export type SalesKpiDataSource = "manual" | "historical_fixture" | "monday" | "epcc_email";
export type SalesKpiMemberClassification = "dashboard_account_manager" | "admin_hidden" | "other_non_dashboard";
export type SalesMetricCode = "MONTHLY_PROFIT" | "QUOTES_DONE" | "ORDERS_PROCESSED" | "CONVERSION_RATE";
export type FinalisableSalesKpiCode = "MONTHLY_PROFIT" | "PK_TAX" | "QUOTES_DONE" | "ORDERS_PROCESSED";
export type SalesKpiMonthFinalValue = { value: number; updatedAt: string; updatedBy: string | null };

export type CompanyKpiMonth = {
  year: number;
  month: number;
  monthlyProfit: number | null;
  monthlyPkTax?: number | null;
  monthlyProfitSource?: SalesKpiDataSource | null;
  quotesDone: number | null;
  ordersProcessed: number | null;
  salesInboxEnquiries: number | null;
  converted: number | null;
  mondaySyncMetadata: { sourceBoardId: string; fetchedAt: string } | null;
  notes: string | null;
  source: SalesKpiDataSource;
  finalValues?: Partial<Record<FinalisableSalesKpiCode, SalesKpiMonthFinalValue>>;
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
  pkTax: number | null;
  snuggleProfit: number | null;
  memberClassification: SalesKpiMemberClassification;
  mondaySourceMetadata: Record<string, unknown> | null;
  epccSourceMetadata: Record<string, unknown> | null;
  source: SalesKpiDataSource;
};

export type SalesKpiTargets = Partial<Record<SalesMetricCode, number>>;

export type YearComparisonMetric = "MONTHLY_PROFIT" | "QUOTES_DONE" | "ORDERS_PROCESSED" | "LEADS" | "CONVERTED" | "CONVERSION_RATE" | "SALES_INBOX_ENQUIRIES" | "SALES_INBOX_CONVERSION_RATE";

export type YearComparisonPoint = {
  month: number;
  label: string;
  monthlyProfit: number | null;
  quotesDone: number | null;
  ordersProcessed: number | null;
  leads: number | null;
  converted: number | null;
  conversionRate: number | null;
  salesInboxEnquiries: number | null;
  salesInboxConversionRate: number | null;
};

export type YearComparisonData = {
  selectedYear: number;
  previousYear: number;
  selected: YearComparisonPoint[];
  previous: YearComparisonPoint[];
};

export type YearToDateData = {
  selectedYear: number;
  cutoffMonth: number;
  includedMonths: number[];
  missingMonths: number[];
  isComplete: boolean;
  ytdActual: number | null;
  ytdTarget: number | null;
  variance: number | null;
  achievementRate: number | null;
  annualTarget: number | null;
  projectedYearEnd: number | null;
  cumulativeActualByMonth: Array<number | null>;
  cumulativeTargetByMonth: Array<number | null>;
};

export const DEFAULT_SALES_KPI_TARGETS: SalesKpiTargets = {
  MONTHLY_PROFIT: 155_000,
  QUOTES_DONE: 300,
  ORDERS_PROCESSED: 200,
  CONVERSION_RATE: 65,
};

export type MetricResult = {
  code: SalesMetricCode | "PK_TAX" | "SALES_INBOX_ENQUIRIES" | "SALES_INBOX_CONVERSION_RATE";
  label: string;
  value: number | null;
  previousYear: number | null;
  difference: number | null;
  percentageChange: number | null;
  target: number | null;
  targetProgress: number | null;
  targetReached: boolean;
  format: "currency" | "number" | "percent";
  calculatedValue?: number | null;
  finalValue?: number | null;
  isFinal?: boolean;
};

export function effectiveCompanyKpiValue(month: CompanyKpiMonth, code: FinalisableSalesKpiCode): number | null {
  const final = month.finalValues?.[code]?.value;
  if (final !== undefined) return final;
  switch (code) {
    case "MONTHLY_PROFIT": return month.monthlyProfit;
    case "PK_TAX": return month.monthlyPkTax ?? null;
    case "QUOTES_DONE": return month.quotesDone;
    case "ORDERS_PROCESSED": return month.ordersProcessed;
  }
}

export type MemberDashboardRow = TeamMemberKpiMonth & {
  conversionRate: number;
  previousYear: TeamMemberKpiMonth | null;
};

export type SalesDashboardData = {
  company: CompanyKpiMonth;
  companyYear: CompanyKpiMonth[];
  previousCompany: CompanyKpiMonth | null;
  members: MemberDashboardRow[];
  targets: SalesKpiTargets;
  yearToDate: YearToDateData;
  yearComparison: YearComparisonData;
  availableYears: number[];
  setupIssue: string | null;
  snuggle: import("../server/snuggleProfit").SnuggleProfitData;
};
