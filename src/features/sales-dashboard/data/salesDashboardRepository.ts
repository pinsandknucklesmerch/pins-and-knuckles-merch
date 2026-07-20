import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";
import { historicalSalesDashboardFixture } from "./workbookFixture";
import { buildDashboardData, mapCompanyRow, mapMemberRow, mapTargets } from "./mappers";
import type { CompanyKpiMonth, SalesDashboardData, TeamMemberKpiMonth } from "../domain/types";

type CompanyInsert = Database["public"]["Tables"]["sales_kpi_months"]["Insert"];
type MemberInsert = Database["public"]["Tables"]["sales_kpi_member_months"]["Insert"];

export async function loadSalesDashboard(year: number, month: number, organisationId: string | null): Promise<SalesDashboardData> {
  const supabase = await createClient();
  const [companyResult, memberResult, targetResult, yearResult] = await Promise.all([
    supabase.from("sales_kpi_months").select("*").in("year", [year, year - 1]).eq("month", month),
    supabase.from("sales_kpi_member_months").select("*").in("year", [year, year - 1]).eq("month", month),
    supabase.from("sales_kpi_targets").select("*"),
    supabase.from("sales_kpi_months").select("year"),
  ]);
  const errors = [companyResult.error, memberResult.error, targetResult.error, yearResult.error].filter(Boolean);
  const companyRows = (companyResult.data ?? []).filter((row) => row.organisation_id === null || row.organisation_id === organisationId);
  const memberRows = (memberResult.data ?? []).filter((row) => row.organisation_id === null || row.organisation_id === organisationId);
  const chooseCompany = (selectedYear: number) => companyRows.find((row) => row.year === selectedYear && row.organisation_id === organisationId) ?? companyRows.find((row) => row.year === selectedYear && row.organisation_id === null) ?? null;
  const chooseMembers = (selectedYear: number) => {
    const rows = memberRows.filter((row) => row.year === selectedYear);
    const organisationKeys = new Set(rows.filter((row) => row.organisation_id === organisationId).map((row) => row.team_member_key));
    return rows.filter((row) => row.organisation_id === organisationId || (row.organisation_id === null && !organisationKeys.has(row.team_member_key))).map(mapMemberRow);
  };
  const fixtureYears = historicalSalesDashboardFixture.years.map((row) => row.year);
  const databaseYears = (yearResult.data ?? []).map((row) => row.year);
  return buildDashboardData({
    companyRow: chooseCompany(year) ? mapCompanyRow(chooseCompany(year)!) : null,
    previousCompanyRow: chooseCompany(year - 1) ? mapCompanyRow(chooseCompany(year - 1)!) : null,
    memberRows: chooseMembers(year), previousMemberRows: chooseMembers(year - 1),
    fixture: historicalSalesDashboardFixture, year, month,
    targets: mapTargets(targetResult.data ?? [], organisationId, new Date(Date.UTC(year, month - 1, 1))),
    availableYears: Array.from(new Set([...fixtureYears, ...databaseYears, year])).sort((a, b) => b - a),
    setupIssue: errors.length ? "Persistent KPI data is unavailable. Historical data is shown." : null,
  });
}

export async function upsertCompanyKpi(input: CompanyKpiMonth, organisationId: string | null, updatedBy: string) {
  const supabase = await createClient();
  const payload: CompanyInsert = { organisation_id: organisationId, year: input.year, month: input.month, monthly_profit: input.monthlyProfit, quotes_done: input.quotesDone, orders_processed: input.ordersProcessed, sales_inbox_enquiries: input.salesInboxEnquiries, converted: input.converted, notes: input.notes, data_source: "manual", updated_by: updatedBy };
  return supabase.from("sales_kpi_months").upsert(payload, { onConflict: "organisation_id,year,month" });
}

export async function upsertMemberKpi(input: TeamMemberKpiMonth, organisationId: string | null, updatedBy: string) {
  const supabase = await createClient();
  const payload: MemberInsert = { organisation_id: organisationId, year: input.year, month: input.month, team_member_key: input.teamMemberKey, team_member_name: input.teamMemberName, quotes_done: input.quotesDone, orders_processed: input.ordersProcessed, sales_inbox_enquiries: input.salesInboxEnquiries, converted: input.converted, profit: input.profit, data_source: "manual", updated_by: updatedBy };
  return supabase.from("sales_kpi_member_months").upsert(payload, { onConflict: "organisation_id,year,month,team_member_key" });
}
