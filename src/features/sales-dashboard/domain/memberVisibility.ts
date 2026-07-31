import type { TeamMemberKpiMonth } from "./types.ts";

type ClassifiedMember = Pick<TeamMemberKpiMonth, "memberClassification">;

export function normalDashboardMembers<T extends ClassifiedMember>(members: T[]) {
  return members.filter((member) => member.memberClassification === "dashboard_account_manager");
}

export function adminVisibleMembers<T extends ClassifiedMember>(members: T[]) {
  return members.filter((member) => member.memberClassification !== undefined);
}

export function reconciliationMembers<T extends ClassifiedMember>(members: T[]) {
  return members.filter((member) => member.memberClassification === "other_non_dashboard");
}
