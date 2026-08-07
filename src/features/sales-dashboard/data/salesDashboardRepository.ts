import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";
import { historicalSalesDashboardFixture } from "./workbookFixture";
import { buildDashboardData, getFixtureCompanyMonth, mapCompanyRow, mapFinalValues, mapMemberRow, mapMonthlyProfitTargets, mapTargets } from "./mappers";
import type { FinalisableSalesKpiCode, SalesDashboardData, SalesKpiTargets } from "../domain/types";
import { calculateYearToDate } from "../domain/calculateYearToDate";
import { buildYearComparison } from "./yearComparison";
import { getSnuggleProfit } from "../server/snuggleProfit";

type TargetInsert = Database["public"]["Tables"]["sales_kpi_targets"]["Insert"];
const QUERY_TIMEOUT_MS = 10_000;
const COMPANY_COLUMNS = "organisation_id,year,month,monthly_profit,monthly_profit_source,quotes_done,orders_processed,sales_inbox_enquiries,converted,monday_sync_metadata,notes,data_source";
const MEMBER_COLUMNS = "organisation_id,year,month,team_member_key,team_member_name,member_classification,quotes_done,orders_processed,sales_inbox_enquiries,converted,profit,pk_tax,snuggle_profit,monday_source_metadata,epcc_source_metadata,data_source";
const TARGET_COLUMNS = "organisation_id,metric_code,target_value,effective_from,effective_to,is_active";
const FINAL_COLUMNS = "organisation_id,year,month,metric_code,final_value,updated_at,updated_by";

function organisationFilter(organisationId: string | null) {
  return organisationId ? `organisation_id.is.null,organisation_id.eq.${organisationId}` : "organisation_id.is.null";
}

export async function loadSalesDashboard(
  year: number,
  month: number,
  organisationId: string | null,
): Promise<SalesDashboardData> {
  const supabase = await createClient();
  const scope = organisationFilter(organisationId);
  const memberPromise = supabase.from("sales_kpi_member_months").select(MEMBER_COLUMNS).or(scope).in("year", [year, year - 1]).lte("month", month).abortSignal(AbortSignal.timeout(QUERY_TIMEOUT_MS));
  const trendPromise = supabase.from("sales_kpi_months").select(COMPANY_COLUMNS).or(scope).abortSignal(AbortSignal.timeout(QUERY_TIMEOUT_MS));
  const targetPromise = supabase.from("sales_kpi_targets").select(TARGET_COLUMNS).or(scope).eq("is_active", true).lte("effective_from", `${year}-12-31`).or(`effective_to.is.null,effective_to.gte.${year}-01-01`).abortSignal(AbortSignal.timeout(QUERY_TIMEOUT_MS));
  const finalPromise = supabase.from("sales_kpi_month_final_values").select(FINAL_COLUMNS).or(scope).in("year", [year, year - 1]).abortSignal(AbortSignal.timeout(QUERY_TIMEOUT_MS));
  const snugglePromise = getSnuggleProfit();
  const [memberResult, trendResult, targetResult, finalResult] = await Promise.all([
    memberPromise,
    trendPromise,
    targetPromise,
    finalPromise,
  ]);
  const errors = [memberResult.error, trendResult.error, targetResult.error, finalResult.error].filter(Boolean);
  const companyRows = trendResult.data ?? [];
  const memberRows = memberResult.data ?? [];
  const trendRows = trendResult.data ?? [];
  const chooseCompany = (selectedYear: number) => companyRows.find((row) => row.year === selectedYear && row.organisation_id === organisationId) ?? companyRows.find((row) => row.year === selectedYear && row.organisation_id === null) ?? null;
  const chooseMembers = (selectedYear: number, selectedMonth: number) => {
    const rows = memberRows.filter((row) => row.year === selectedYear && row.month === selectedMonth);
    const organisationKeys = new Set(rows.filter((row) => row.organisation_id === organisationId).map((row) => row.team_member_key));
    return rows.filter((row) => row.organisation_id === organisationId || (row.organisation_id === null && !organisationKeys.has(row.team_member_key))).map(mapMemberRow);
  };
  const chooseMemberHistory = (selectedYear: number, selectedMonth: number) => {
    const rows = memberRows.filter((row) => row.year === selectedYear && row.month <= selectedMonth);
    const organisationKeys = new Set(rows.filter((row) => row.organisation_id === organisationId).map((row) => `${row.year}-${row.month}-${row.team_member_key}`));
    return rows.filter((row) => row.organisation_id === organisationId || (row.organisation_id === null && !organisationKeys.has(`${row.year}-${row.month}-${row.team_member_key}`))).map(mapMemberRow);
  };
  const chooseTrendCompany = (selectedYear: number, selectedMonth: number) => trendRows.find((row) => row.year === selectedYear && row.month === selectedMonth && row.organisation_id === organisationId) ?? trendRows.find((row) => row.year === selectedYear && row.month === selectedMonth && row.organisation_id === null) ?? null;
  const trendYear = (selectedYear: number) => Array.from({ length: 12 }, (_, index) => {
    const selectedMonth = index + 1;
    const row = chooseTrendCompany(selectedYear, selectedMonth);
    return row ? mapCompanyRow(row) : getFixtureCompanyMonth(historicalSalesDashboardFixture, selectedYear, selectedMonth);
  });
  const authoritativeYear = Array.from({ length: 12 }, (_, index) => {
    const row = chooseTrendCompany(year, index + 1);
    return row ? mapCompanyRow(row) : null;
  });
  const fixtureYears = historicalSalesDashboardFixture.years.map((row) => row.year);
  const databaseYears = trendRows.map((row) => row.year);
  const company = chooseCompany(year);
  const previousCompany = chooseCompany(year - 1);
  const targetRows = targetResult.data ?? [];
  const result = buildDashboardData({
    companyRow: company ? mapCompanyRow(company) : null,
    previousCompanyRow: previousCompany ? mapCompanyRow(previousCompany) : null,
    trendCurrent: trendYear(year), trendPrevious: trendYear(year - 1),
    memberRows: chooseMembers(year, month), previousMemberRows: chooseMembers(year - 1, month), memberHistoryRows: chooseMemberHistory(year, month),
    fixture: historicalSalesDashboardFixture, year, month,
    targets: mapTargets(targetRows, organisationId, new Date(Date.UTC(year, month - 1, 1))),
    authoritativeCompanyYear: authoritativeYear, monthlyProfitTargets: mapMonthlyProfitTargets(targetRows, organisationId, year),
    availableYears: Array.from(new Set([...fixtureYears, ...databaseYears, year])).sort((a, b) => b - a),
    setupIssue: errors.length ? "Persistent KPI data is unavailable. Historical data is shown." : null,
    snuggle: await snugglePromise,
  });
  const finalsFor = (selectedYear: number, selectedMonth: number) => {
    const rows = (finalResult.data ?? []).filter((row) => row.year === selectedYear && row.month === selectedMonth);
    const own = rows.filter((row) => row.organisation_id === organisationId);
    return mapFinalValues(own.length ? own : rows.filter((row) => row.organisation_id === null));
  };
  const sumPkTax = (rows: ReturnType<typeof chooseMembers>) => {
    const values = rows.map((row) => row.pkTax).filter((value): value is number => value !== null);
    return values.length ? values.reduce((total, value) => total + value, 0) : null;
  };
  const companyYear = result.companyYear.map((row) => ({ ...row, finalValues: finalsFor(row.year, row.month) }));
  const previousCompanyYear = trendYear(year - 1).map((row) => ({ ...row, finalValues: finalsFor(row.year, row.month) }));
  const currentCompany = { ...result.company, monthlyPkTax: sumPkTax(chooseMembers(year, month)), finalValues: finalsFor(year, month) };
  const priorCompany = result.previousCompany ? { ...result.previousCompany, monthlyPkTax: sumPkTax(chooseMembers(year - 1, month)), finalValues: finalsFor(year - 1, month) } : null;
  return {
    ...result,
    company: currentCompany,
    previousCompany: priorCompany,
    companyYear,
    yearComparison: buildYearComparison(year, companyYear, previousCompanyYear),
    yearToDate: calculateYearToDate(year, month, companyYear, mapMonthlyProfitTargets(targetRows, organisationId, year)),
  };
}

export async function saveSalesKpiMonthFinalValue(input: { organisationId: string; userId: string; year: number; month: number; metricCode: FinalisableSalesKpiCode; value: number }) {
  const supabase = await createClient();
  return supabase.from("sales_kpi_month_final_values").upsert({ organisation_id: input.organisationId, updated_by: input.userId, year: input.year, month: input.month, metric_code: input.metricCode, final_value: input.value }, { onConflict: "organisation_id,year,month,metric_code" });
}

export async function clearSalesKpiMonthFinalValue(input: { organisationId: string; year: number; month: number; metricCode: FinalisableSalesKpiCode }) {
  const supabase = await createClient();
  return supabase.from("sales_kpi_month_final_values").delete().eq("organisation_id", input.organisationId).eq("year", input.year).eq("month", input.month).eq("metric_code", input.metricCode);
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
