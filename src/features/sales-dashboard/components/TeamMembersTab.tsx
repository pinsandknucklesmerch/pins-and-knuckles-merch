"use client";

import { EmptyState } from "@/components/ui/EmptyState";
import { Panel } from "@/components/ui/Panel";
import type { SalesDashboardData } from "../domain/types";
import { getVisibleTeamMembers } from "../lib/teamMembersTab";
import { MemberSummaryCard } from "./MemberKpiPresentation";

export function TeamMembersTab({ data, year, month, tvMode = false }: { data: SalesDashboardData; year: number; month: number; tvMode?: boolean }) {
  const visibleMembers = getVisibleTeamMembers(data.members);

  if (!visibleMembers.length) return <EmptyState title="No team member data" />;

  return <Panel tvGroup={tvMode ? "team-members-panel" : undefined} className={tvMode ? "w-full" : undefined}><div data-testid="team-members-tab" data-tv-view={tvMode ? "team_members" : undefined} className="flex flex-col gap-5">{visibleMembers.map((member, index) => <MemberSummaryCard key={member.teamMemberKey} rows={data.members} memberKey={member.teamMemberKey} year={year} month={month} tvMode={tvMode} animationIndex={index} />)}</div></Panel>;
}
