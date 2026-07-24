import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";
import { historicalSalesDashboardFixture } from "./workbookFixture";
import { buildDashboardData, getFixtureCompanyMonth, mapCompanyRow, mapMemberRow, mapTargets } from "./mappers";
import type { SalesDashboardData, SalesKpiTargets } from "../domain/types";
import { getSalesDashboardQueryPlan, type DashboardView } from "../lib/queryPlan";

type TargetInsert = Database["public"]["Tables"]["sales_kpi_targets"]["Insert"];
const QUERY_TIMEOUT_MS = 10_000;
const COMPANY_COLUMNS = "organisation_id,year,month,monthly_profit,monthly_profit_source,quotes_done,orders_processed,sales_inbox_enquiries,converted,monday_sync_metadata,notes,data_source";
const MEMBER_COLUMNS = "organisation_id,year,month,team_member_key,team_member_name,quotes_done,orders_processed,sales_inbox_enquiries,converted,profit,data_source";
const TARGET_COLUMNS = "organisation_id,metric_code,target_value,effective_from,effective_to,is_active";

function organisationFilter(organisationId: string | null) {
  return organisationId ? `organisation_id.is.null,organisation_id.eq.${organisationId}` : "organisation_id.is.null";
}

export async function loadSalesDashboard(
  year: number,
  month: number,
  organisationId: string | null,
  view: DashboardView,
  includeCompanyEntry: boolean,
): Promise<SalesDashboardData> {
  const supabase = await createClient();
  const scope = organisationFilter(organisationId);
  const plan = getSalesDashboardQueryPlan(view, includeCompanyEntry, year);
  const companyPromise = plan.fetchCompany
    ? supabase.from("sales_kpi_months").select(COMPANY_COLUMNS).or(scope).in("year", plan.companyYears).eq("month", month).abortSignal(AbortSignal.timeout(QUERY_TIMEOUT_MS))
    : Promise.resolve({ data: [], error: null });
  const memberPromise = plan.fetchMembers
    ? supabase.from("sales_kpi_member_months").select(MEMBER_COLUMNS).or(scope).in("year", [year, year - 1]).eq("month", month).abortSignal(AbortSignal.timeout(QUERY_TIMEOUT_MS))
    : Promise.resolve({ data: [], error: null });
  const trendPromise = view === "company"
    ? supabase.from("sales_kpi_months").select(COMPANY_COLUMNS).or(scope).in("year", [year, year - 1]).abortSignal(AbortSignal.timeout(QUERY_TIMEOUT_MS))
    : Promise.resolve({ data: [], error: null });
  const targetPromise = plan.fetchTargets
    ? supabase.from("sales_kpi_targets").select(TARGET_COLUMNS).or(scope).eq("is_active", true).lte("effective_from", `${year}-12-31`).or(`effective_to.is.null,effective_to.gte.${year}-01-01`).abortSignal(AbortSignal.timeout(QUERY_TIMEOUT_MS))
    : Promise.resolve({ data: [], error: null });
  const [companyResult, memberResult, trendResult, targetResult, yearResult] = await Promise.all([
    companyPromise,
    memberPromise,
    trendPromise,
    targetPromise,
    supabase.from("sales_kpi_months").select("year").or(scope).limit(1000).abortSignal(AbortSignal.timeout(QUERY_TIMEOUT_MS)),
  ]);
  const errors = [companyResult.error, memberResult.error, trendResult.error, targetResult.error, yearResult.error].filter(Boolean);
  const companyRows = companyResult.data ?? [];
  const memberRows = memberResult.data ?? [];
  const trendRows = trendResult.data ?? [];
  const chooseCompany = (selectedYear: number) => companyRows.find((row) => row.year === selectedYear && row.organisation_id === organisationId) ?? companyRows.find((row) => row.year === selectedYear && row.organisation_id === null) ?? null;
  const chooseMembers = (selectedYear: number) => {
    const rows = memberRows.filter((row) => row.year === selectedYear);
    const organisationKeys = new Set(rows.filter((row) => row.organisation_id === organisationId).map((row) => row.team_member_key));
    return rows.filter((row) => row.organisation_id === organisationId || (row.organisation_id === null && !organisationKeys.has(row.team_member_key))).map(mapMemberRow);
  };
  const chooseTrendCompany = (selectedYear: number, selectedMonth: number) => trendRows.find((row) => row.year === selectedYear && row.month === selectedMonth && row.organisation_id === organisationId) ?? trendRows.find((row) => row.year === selectedYear && row.month === selectedMonth && row.organisation_id === null) ?? null;
  const trendYear = (selectedYear: number) => Array.from({ length: 12 }, (_, index) => {
    const selectedMonth = index + 1;
    const row = chooseTrendCompany(selectedYear, selectedMonth);
    return row ? mapCompanyRow(row) : getFixtureCompanyMonth(historicalSalesDashboardFixture, selectedYear, selectedMonth);
  });
  const fixtureYears = historicalSalesDashboardFixture.years.map((row) => row.year);
  const databaseYears = (yearResult.data ?? []).map((row) => row.year);
  const company = chooseCompany(year);
  const previousCompany = chooseCompany(year - 1);
  return buildDashboardData({
    companyRow: company ? mapCompanyRow(company) : null,
    previousCompanyRow: previousCompany ? mapCompanyRow(previousCompany) : null,
    trendCurrent: trendYear(year), trendPrevious: trendYear(year - 1),
    memberRows: chooseMembers(year), previousMemberRows: chooseMembers(year - 1),
    fixture: historicalSalesDashboardFixture, year, month,
    targets: mapTargets(targetResult.data ?? [], organisationId, new Date(Date.UTC(year, month - 1, 1))),
    availableYears: Array.from(new Set([...fixtureYears, ...databaseYears, year])).sort((a, b) => b - a),
    setupIssue: errors.length ? "Persistent KPI data is unavailable. Historical data is shown." : null,
  });
}

export async function upsertSalesKpiTargets(targets: Required<SalesKpiTargets>, organisationId: string, effectiveFrom: string) {
  const supabase = await createClient();
  const payload: TargetInsert[] = Object.entries(targets).map(([metricCode, targetValue]) => ({
    organisation_id: organisationId,
    metric_code: metricCode,
    target_value: targetValue,
    effective_from: effectiveFrom,
    is_active: true,
  }));
  return supabase.from("sales_kpi_targets").upsert(payload, { onConflict: "organisation_id,metric_code,effective_from" });
}
