import { normalDashboardMembers } from "../domain/memberVisibility.ts";
import type { MemberDashboardRow, TeamMemberKpiMonth } from "../domain/types.ts";
import type { SnuggleProfitData } from "./snuggleProfit.ts";

export function getVisibleTeamMembers(rows: MemberDashboardRow[]) {
  return normalDashboardMembers(rows);
}

export function getMemberSnuggleProfit(data: SnuggleProfitData, memberKey: string, year: number, month: number) {
  const member = data.members.find((candidate) => candidate.memberKey === memberKey);
  return member?.months.find((candidate) => candidate.year === year && candidate.month === month)?.total ?? null;
}

export function getTeamMemberHistory(
  rows: TeamMemberKpiMonth[],
  memberKey: string,
  year: number,
  month: number,
) {
  return rows
    .filter((row) => row.teamMemberKey === memberKey && row.year === year && row.month <= month)
    .sort((left, right) => left.month - right.month);
}
