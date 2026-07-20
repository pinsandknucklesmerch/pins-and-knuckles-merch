import type { MemberDashboardRow, TeamMemberKpiMonth } from "./types.ts";

export function normaliseTeamMemberName(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLocaleLowerCase("en-GB").replace(/\b\p{L}/gu, (letter) => letter.toLocaleUpperCase("en-GB"));
}

export function normaliseTeamMemberKey(value: string): string {
  return normaliseTeamMemberName(value).toLocaleLowerCase("en-GB").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function sortTeamMembers<T extends Pick<TeamMemberKpiMonth, "teamMemberName" | "teamMemberKey">>(rows: T[]): T[] {
  return [...rows].sort((a, b) => a.teamMemberName.localeCompare(b.teamMemberName, "en-GB", { sensitivity: "base" }) || a.teamMemberKey.localeCompare(b.teamMemberKey));
}

export function findPreviousMember(current: TeamMemberKpiMonth, previous: TeamMemberKpiMonth[]): TeamMemberKpiMonth | null {
  return previous.find((row) => normaliseTeamMemberKey(row.teamMemberKey) === normaliseTeamMemberKey(current.teamMemberKey)) ?? null;
}

export function sortMemberDashboardRows(rows: MemberDashboardRow[]): MemberDashboardRow[] {
  return sortTeamMembers(rows);
}
