import type { Database } from "@/types/database.types";
import type { HistoricalSalesDashboardFixture } from "../types.ts";
import { DASHBOARD_MONTHS } from "../types.ts";
import { calculateConversionRate } from "../domain/calculateDashboardKpis.ts";
import { findPreviousMember, normaliseTeamMemberKey, normaliseTeamMemberName, sortMemberDashboardRows } from "../domain/normaliseTeamMember.ts";
import { DEFAULT_SALES_KPI_TARGETS, type CompanyKpiMonth, type MemberDashboardRow, type SalesDashboardData, type SalesKpiTargets, type TeamMemberKpiMonth } from "../domain/types.ts";

type CompanyRow = Pick<Database["public"]["Tables"]["sales_kpi_months"]["Row"], "year" | "month" | "monthly_profit" | "quotes_done" | "orders_processed" | "sales_inbox_enquiries" | "converted" | "notes" | "data_source">;
type MemberRow = Pick<Database["public"]["Tables"]["sales_kpi_member_months"]["Row"], "year" | "month" | "team_member_key" | "team_member_name" | "quotes_done" | "orders_processed" | "sales_inbox_enquiries" | "converted" | "profit" | "data_source">;
type TargetRow = Pick<Database["public"]["Tables"]["sales_kpi_targets"]["Row"], "organisation_id" | "metric_code" | "target_value" | "effective_from" | "effective_to" | "is_active">;

export function mapCompanyRow(row: CompanyRow): CompanyKpiMonth {
  return { year: row.year, month: row.month, monthlyProfit: row.monthly_profit, quotesDone: row.quotes_done, ordersProcessed: row.orders_processed, salesInboxEnquiries: row.sales_inbox_enquiries, converted: row.converted, notes: row.notes, source: row.data_source as CompanyKpiMonth["source"] };
}

export function mapMemberRow(row: MemberRow): TeamMemberKpiMonth {
  return { year: row.year, month: row.month, teamMemberKey: row.team_member_key, teamMemberName: row.team_member_name, quotesDone: row.quotes_done, ordersProcessed: row.orders_processed, salesInboxEnquiries: row.sales_inbox_enquiries, converted: row.converted, profit: row.profit, source: row.data_source as TeamMemberKpiMonth["source"] };
}

export function getFixtureCompanyMonth(fixture: HistoricalSalesDashboardFixture, year: number, month: number): CompanyKpiMonth {
  const index = month - 1;
  const general = fixture.years.find((row) => row.year === year);
  const inbox = fixture.salesInbox.find((row) => row.year === year);
  return { year, month, monthlyProfit: general?.profit[index] ?? null, quotesDone: general?.enquiries[index] ?? null, ordersProcessed: null, salesInboxEnquiries: inbox?.enquiries[index] ?? null, converted: inbox?.conversions[index] ?? null, notes: null, source: "historical_fixture" };
}

export function getFixtureMembers(fixture: HistoricalSalesDashboardFixture, year: number, month: number): TeamMemberKpiMonth[] {
  const monthName = DASHBOARD_MONTHS[month - 1];
  const rows = fixture.salespersonYears.find((item) => item.year === year)?.months[monthName] ?? [];
  return rows.map((row) => ({ year, month, teamMemberKey: normaliseTeamMemberKey(row.salespersonName), teamMemberName: normaliseTeamMemberName(row.salespersonName), quotesDone: null, ordersProcessed: null, salesInboxEnquiries: row.enquiries, converted: row.conversions, profit: row.totalProfit, source: "historical_fixture" }));
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
  for (const row of applicable.filter((item) => item.organisation_id === null)) result[row.metric_code as keyof SalesKpiTargets] = row.target_value;
  for (const row of applicable.filter((item) => item.organisation_id === organisationId)) result[row.metric_code as keyof SalesKpiTargets] = row.target_value;
  return result;
}

export function buildMemberRows(current: TeamMemberKpiMonth[], previous: TeamMemberKpiMonth[]): MemberDashboardRow[] {
  return sortMemberDashboardRows(current.map((row) => ({ ...row, conversionRate: calculateConversionRate(row.converted, row.salesInboxEnquiries), previousYear: findPreviousMember(row, previous) })));
}

export function buildDashboardData(args: {
  companyRow: CompanyKpiMonth | null; previousCompanyRow: CompanyKpiMonth | null;
  memberRows: TeamMemberKpiMonth[]; previousMemberRows: TeamMemberKpiMonth[];
  fixture: HistoricalSalesDashboardFixture; year: number; month: number; targets: SalesKpiTargets;
  availableYears: number[]; setupIssue?: string | null;
}): SalesDashboardData {
  const fixtureCompany = getFixtureCompanyMonth(args.fixture, args.year, args.month);
  const previousFixture = getFixtureCompanyMonth(args.fixture, args.year - 1, args.month);
  const currentMembers = mergeMemberMonths(args.memberRows, getFixtureMembers(args.fixture, args.year, args.month));
  const previousMembers = mergeMemberMonths(args.previousMemberRows, getFixtureMembers(args.fixture, args.year - 1, args.month));
  return { company: mergeCompanyMonth(args.companyRow, fixtureCompany), previousCompany: mergeCompanyMonth(args.previousCompanyRow, previousFixture), members: buildMemberRows(currentMembers, previousMembers), targets: args.targets, availableYears: args.availableYears, setupIssue: args.setupIssue ?? null };
}
