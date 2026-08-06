import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";
import { mapMondayMember } from "../domain/memberIdentity";
import type { TeamMemberKpiMonth } from "../domain/types";
import { getFixtureMembers, mapMemberRow } from "./mappers";
import { historicalSalesDashboardFixture } from "./workbookFixture";

const MEMBER_COLUMNS = "organisation_id,year,month,team_member_key,team_member_name,member_classification,quotes_done,orders_processed,sales_inbox_enquiries,converted,profit,pk_tax,snuggle_profit,monday_source_metadata,epcc_source_metadata,data_source";

type MemberRow = Pick<Database["public"]["Tables"]["sales_kpi_member_months"]["Row"], "organisation_id" | "year" | "month" | "team_member_key" | "team_member_name" | "quotes_done" | "orders_processed" | "sales_inbox_enquiries" | "converted" | "profit" | "pk_tax" | "snuggle_profit" | "member_classification" | "monday_source_metadata" | "epcc_source_metadata" | "data_source">;

export type MemberPerformanceData = {
  memberKey: string;
  memberName: string;
  rows: TeamMemberKpiMonth[];
  availableYears: number[];
};

function fixtureMemberRows(memberKey: string): TeamMemberKpiMonth[] {
  return historicalSalesDashboardFixture.salespersonYears.flatMap((yearData) =>
    Object.entries(yearData.months).flatMap(([monthName]) => {
      const month = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].indexOf(monthName) + 1;
      return getFixtureMembers(historicalSalesDashboardFixture, yearData.year, month)
        .filter((row) => row.teamMemberKey === memberKey);
    }),
  );
}

function mergeRows(databaseRows: MemberRow[], fixtureRows: TeamMemberKpiMonth[], organisationId: string | null): TeamMemberKpiMonth[] {
  const selectedDatabase = new Map<string, TeamMemberKpiMonth>();
  for (const row of databaseRows) {
    const key = `${row.year}-${row.month}`;
    if (row.organisation_id === organisationId || !selectedDatabase.has(key)) selectedDatabase.set(key, mapMemberRow(row));
  }
  const merged = new Map<string, TeamMemberKpiMonth>(selectedDatabase);
  for (const row of fixtureRows) {
    const key = `${row.year}-${row.month}`;
    if (!merged.has(key)) merged.set(key, row);
  }
  return [...merged.values()].sort((left, right) => left.year - right.year || left.month - right.month);
}

export async function loadMemberPerformance(memberKey: string, organisationId: string | null): Promise<MemberPerformanceData> {
  const supabase = await createClient();
  const scope = organisationId ? `organisation_id.is.null,organisation_id.eq.${organisationId}` : "organisation_id.is.null";
  const { data } = await supabase
    .from("sales_kpi_member_months")
    .select(MEMBER_COLUMNS)
    .eq("team_member_key", memberKey)
    .or(scope)
    .order("year")
    .order("month");
  const rows = mergeRows((data ?? []) as MemberRow[], fixtureMemberRows(memberKey), organisationId);
  const identity = mapMondayMember({ name: memberKey });
  return {
    memberKey,
    memberName: rows[0]?.teamMemberName ?? identity.displayName,
    rows,
    availableYears: [...new Set(rows.map((row) => row.year))].sort((left, right) => left - right),
  };
}
