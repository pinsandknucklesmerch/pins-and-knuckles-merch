"use client";

import { useEffect, useMemo, useState } from "react";
import { EmptyState } from "@/components/ui/EmptyState";
import { Panel } from "@/components/ui/Panel";
import { Select } from "@/components/ui/Select";
import type { MemberDashboardRow, SalesDashboardData } from "../domain/types";
import { getVisibleTeamMembers } from "../lib/teamMembersTab";
import { MemberKpiCards, MemberKpiHistoryTable } from "./MemberKpiPresentation";

export function TeamMembersTab({ data, year, month }: { data: SalesDashboardData; year: number; month: number }) {
  const visibleMembers = useMemo(() => getVisibleTeamMembers(data.members), [data.members]);
  const firstMemberKey = visibleMembers[0]?.teamMemberKey ?? "";
  const [selectedKey, setSelectedKey] = useState(firstMemberKey);

  useEffect(() => {
    setSelectedKey((current) => visibleMembers.some((row) => row.teamMemberKey === current) ? current : firstMemberKey);
  }, [firstMemberKey, visibleMembers]);

  const selected = visibleMembers.find((row) => row.teamMemberKey === selectedKey) ?? null;

  if (!visibleMembers.length) return <EmptyState title="No team member data" />;

  return <div data-testid="team-members-tab" className="grid gap-3">
    <Panel title="Team Members">
      <label className="grid max-w-sm gap-1 text-xs font-medium text-muted-foreground" htmlFor="team-member-select">Member<Select id="team-member-select" value={selectedKey} onValueChange={setSelectedKey} aria-label="Select team member">{visibleMembers.map((row) => <option key={row.teamMemberKey} value={row.teamMemberKey}>{row.teamMemberName}</option>)}</Select></label>
    </Panel>
    {selected ? <div className="grid content-start gap-3"><Panel title={selected.teamMemberName}><MemberKpiCards rows={data.memberHistory} memberKey={selected.teamMemberKey} year={year} month={month} /></Panel><Panel title="Monthly history"><MemberKpiHistoryTable rows={data.memberHistory} memberKey={selected.teamMemberKey} year={year} month={month} /></Panel></div> : null}
  </div>;
}

export function getTeamMemberSelectionRows(rows: MemberDashboardRow[]) {
  return getVisibleTeamMembers(rows).map((row) => ({ key: row.teamMemberKey, name: row.teamMemberName }));
}
