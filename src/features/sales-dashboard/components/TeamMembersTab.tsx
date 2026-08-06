"use client";

import { EmptyState } from "@/components/ui/EmptyState";
import { Panel } from "@/components/ui/Panel";
import type { SalesDashboardData } from "../domain/types";
import { getVisibleTeamMembers } from "../lib/teamMembersTab";
import { MemberSummaryCard } from "./MemberKpiPresentation";

export function TeamMembersTab({ data, year, month }: { data: SalesDashboardData; year: number; month: number }) {
  const visibleMembers = getVisibleTeamMembers(data.members);

  if (!visibleMembers.length) return <EmptyState title="No team member data" />;

  return <Panel><div data-testid="team-members-tab" className="flex flex-col gap-5">{visibleMembers.map((member) => <MemberSummaryCard key={member.teamMemberKey} rows={data.members} memberKey={member.teamMemberKey} year={year} month={month} />)}</div></Panel>;
}
