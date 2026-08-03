import type { Database } from "@/types/database.types";
import type { HistoricalSalesDashboardFixture } from "../types.ts";
import { DASHBOARD_MONTHS } from "../types.ts";
import { calculateConversionRate } from "../domain/calculateDashboardKpis.ts";
import { findPreviousMember, normaliseTeamMemberKey, sortMemberDashboardRows } from "../domain/normaliseTeamMember.ts";
import { mapMondayMember } from "../domain/memberIdentity.ts";
import { DEFAULT_SALES_KPI_TARGETS, type CompanyKpiMonth, type FinalisableSalesKpiCode, type MemberDashboardRow, type SalesDashboardData, type SalesKpiMonthFinalValue, type SalesKpiTargets, type TeamMemberKpiMonth } from "../domain/types.ts";
import { buildYearComparison } from "./yearComparison.ts";
import { calculateYearToDate } from "../domain/calculateYearToDate.ts";

type CompanyRow = Pick<Database["public"]["Tables"]["sales_kpi_months"]["Row"], "year" | "month" | "monthly_profit" | "monthly_profit_source" | "quotes_done" | "orders_processed" | "sales_inbox_enquiries" | "converted" | "monday_sync_metadata" | "notes" | "data_source">;
type MemberRow = Pick<Database["public"]["Tables"]["sales_kpi_member_months"]["Row"], "year" | "month" | "team_member_key" | "team_member_name" | "quotes_done" | "orders_processed" | "sales_inbox_enquiries" | "converted" | "profit" | "pk_tax" | "snuggle_profit" | "member_classification" | "monday_source_metadata" | "epcc_source_metadata" | "data_source">;
type TargetRow = Pick<Database["public"]["Tables"]["sales_kpi_targets"]["Row"], "organisation_id" | "metric_code" | "target_value" | "effective_from" | "effective_to" | "is_active">;
type FinalRow = Pick<Database["public"]["Tables"]["sales_kpi_month_final_values"]["Row"], "metric_code" | "final_value" | "updated_at" | "updated_by">;

export function mapCompanyRow(row: CompanyRow): CompanyKpiMonth {
  const metadata = row.monday_sync_metadata && typeof row.monday_sync_metadata === "object" && !Array.isArray(row.monday_sync_metadata)
    ? row.monday_sync_metadata as { sourceBoardId?: unknown; fetchedAt?: unknown }
    : null;
  return { year: row.year, month: row.month, monthlyProfit: row.monthly_profit, monthlyProfitSource: row.monthly_profit_source as CompanyKpiMonth["source"] | null, quotesDone: row.quotes_done, ordersProcessed: row.orders_processed, salesInboxEnquiries: row.sales_inbox_enquiries, converted: row.converted, mondaySyncMetadata: typeof metadata?.sourceBoardId === "string" && typeof metadata.fetchedAt === "string" ? { sourceBoardId: metadata.sourceBoardId, fetchedAt: metadata.fetchedAt } : null, notes: row.notes, source: row.data_source as CompanyKpiMonth["source"], finalValues: {} };
}

export function mapFinalValues(rows: FinalRow[]): Partial<Record<FinalisableSalesKpiCode, SalesKpiMonthFinalValue>> {
  return Object.fromEntries(rows.map((row) => [row.metric_code, { value: row.final_value, updatedAt: row.updated_at, updatedBy: row.updated_by }])) as Partial<Record<FinalisableSalesKpiCode, SalesKpiMonthFinalValue>>;
}

export function mapMemberRow(row: MemberRow): TeamMemberKpiMonth {
  return { year: row.year, month: row.month, teamMemberKey: row.team_member_key, teamMemberName: row.team_member_name, quotesDone: row.quotes_done, ordersProcessed: row.orders_processed, salesInboxEnquiries: row.sales_inbox_enquiries, converted: row.converted, profit: row.profit, pkTax: row.pk_tax, snuggleProfit: row.snuggle_profit, memberClassification: row.member_classification as TeamMemberKpiMonth["memberClassification"], mondaySourceMetadata: row.monday_source_metadata as Record<string, unknown> | null, epccSourceMetadata: row.epcc_source_metadata as Record<string, unknown> | null, source: row.data_source as TeamMemberKpiMonth["source"] };
}

export function getFixtureCompanyMonth(fixture: HistoricalSalesDashboardFixture, year: number, month: number): CompanyKpiMonth {
  const index = month - 1;
  const general = fixture.years.find((row) => row.year === year);
  const inbox = fixture.salesInbox.find((row) => row.year === year);
  return { year, month, monthlyProfit: general?.profit[index] ?? null, monthlyProfitSource: "historical_fixture", quotesDone: general?.enquiries[index] ?? null, ordersProcessed: null, salesInboxEnquiries: inbox?.enquiries[index] ?? null, converted: inbox?.conversions[index] ?? null, mondaySyncMetadata: null, notes: null, source: "historical_fixture" };
}

export function getFixtureMembers(fixture: HistoricalSalesDashboardFixture, year: number, month: number): TeamMemberKpiMonth[] {
  const monthName = DASHBOARD_MONTHS[month - 1];
  const rows = fixture.salespersonYears.find((item) => item.year === year)?.months[monthName] ?? [];
  return rows.map((row) => {
    const member = mapMondayMember({ name: row.salespersonName });
    return { year, month, teamMemberKey: member.key, teamMemberName: member.displayName, quotesDone: null, ordersProcessed: null, salesInboxEnquiries: row.enquiries, converted: row.conversions, profit: row.totalProfit, pkTax: null, snuggleProfit: null, memberClassification: member.classification, mondaySourceMetadata: null, epccSourceMetadata: null, source: "historical_fixture" };
  });
}

export function mergeCompanyMonth(database: CompanyKpiMonth | null, fixture: CompanyKpiMonth): CompanyKpiMonth {
  return database ?? fixture;
}

export function mergeMemberMonths(database: TeamMemberKpiMonth[], fixture: TeamMemberKpiMonth[]): TeamMemberKpiMonth[] {
  if (!database.length) return fixture;
  const databaseKeys = new Set(database.map((row) => normaliseTeamMemberKey(row.teamMemberKey)));
  return [...database, ...fixture.filter((row) => !databaseKeys.has(normaliseTeamMemberKey(row.teamMemberKey)))];
}

export function mapTargets(rows: TargetRow[], organisationId: string | null, period: Date): SalesKpiTargets {
  const iso = period.toISOString().slice(0, 10);
  const applicable = rows.filter((row) => row.is_active && row.effective_from <= iso && (!row.effective_to || row.effective_to >= iso));
  const result: SalesKpiTargets = { ...DEFAULT_SALES_KPI_TARGETS };
  const orderedByEffectiveDate = (scope: TargetRow[]) => [...scope].sort((left, right) => left.effective_from.localeCompare(right.effective_from));
  for (const row of orderedByEffectiveDate(applicable.filter((item) => item.organisation_id === null))) result[row.metric_code as keyof SalesKpiTargets] = row.target_value;
  for (const row of orderedByEffectiveDate(applicable.filter((item) => item.organisation_id === organisationId))) result[row.metric_code as keyof SalesKpiTargets] = row.target_value;
  return result;
}

export function mapMonthlyProfitTargets(rows: TargetRow[], organisationId: string | null, year: number): Array<number | null> {
  return Array.from({ length: 12 }, (_, index) => mapTargets(rows, organisationId, new Date(Date.UTC(year, index, 1))).MONTHLY_PROFIT ?? null);
}

export function buildMemberRows(current: TeamMemberKpiMonth[], previous: TeamMemberKpiMonth[]): MemberDashboardRow[] {
  return sortMemberDashboardRows(current.map((row) => ({ ...row, conversionRate: calculateConversionRate(row.converted, row.salesInboxEnquiries), previousYear: findPreviousMember(row, previous) })));
}

export function buildDashboardData(args: {
  companyRow: CompanyKpiMonth | null; previousCompanyRow: CompanyKpiMonth | null;
  trendCurrent: CompanyKpiMonth[]; trendPrevious: CompanyKpiMonth[];
  memberRows: TeamMemberKpiMonth[]; previousMemberRows: TeamMemberKpiMonth[];
  fixture: HistoricalSalesDashboardFixture; year: number; month: number; targets: SalesKpiTargets;
  authoritativeCompanyYear?: Array<CompanyKpiMonth | null>; monthlyProfitTargets?: Array<number | null>;
  availableYears: number[]; setupIssue?: string | null;
}): SalesDashboardData {
  const fixtureCompany = getFixtureCompanyMonth(args.fixture, args.year, args.month);
  const previousFixture = getFixtureCompanyMonth(args.fixture, args.year - 1, args.month);
  const currentMembers = mergeMemberMonths(args.memberRows, getFixtureMembers(args.fixture, args.year, args.month));
  const previousMembers = mergeMemberMonths(args.previousMemberRows, getFixtureMembers(args.fixture, args.year - 1, args.month));
  return { company: mergeCompanyMonth(args.companyRow, fixtureCompany), companyYear: args.trendCurrent, previousCompany: mergeCompanyMonth(args.previousCompanyRow, previousFixture), members: buildMemberRows(currentMembers, previousMembers), targets: args.targets, yearToDate: calculateYearToDate(args.year, args.month, args.authoritativeCompanyYear ?? [], args.monthlyProfitTargets ?? Array(12).fill(args.targets.MONTHLY_PROFIT ?? null)), yearComparison: buildYearComparison(args.year, args.trendCurrent, args.trendPrevious), availableYears: args.availableYears, setupIssue: args.setupIssue ?? null };
}
