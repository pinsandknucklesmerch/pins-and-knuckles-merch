"use client";

import { useCallback, useState } from "react";
import { DashboardNav } from "metricui";
import { Panel } from "@/components/ui/Panel";
import { EmptyState } from "@/components/ui/EmptyState";
import { DASHBOARD_MONTHS } from "../types";
import type { SalesDashboardData } from "../domain/types";
import { CompanyKpiView } from "./CompanyKpiView";
import { TeamMemberKpiView } from "./TeamMemberKpiView";
import { ManualKpiEntry } from "./ManualKpiEntry";
import { MetricDashboardProvider } from "./MetricDashboardProvider";
import { YearComparisonChart } from "./YearComparisonChart";
import type { DashboardView } from "../lib/dashboardView";
import styles from "./SalesDashboard.module.css";

const DASHBOARD_TABS = [
  { value: "overview", label: "Overview" },
  { value: "year-comparison", label: "Year Comparison" },
];

export function SalesDashboard({ data, year, month, view, member, isAdmin, initialDashboardView }: { data: SalesDashboardData; year: number; month: number; view: "company" | "members"; member?: string; isAdmin: boolean; initialDashboardView: DashboardView }) {
  const [activeDashboardView, setActiveDashboardView] = useState<DashboardView>(initialDashboardView);
  const changeDashboardView = useCallback((value: string) => {
    const nextView = value === "year-comparison" ? "year-comparison" : "overview";
    setActiveDashboardView((currentView) => currentView === nextView ? currentView : nextView);
  }, []);

  return <MetricDashboardProvider><div className="grid gap-3">
    <Panel><form className="flex flex-wrap items-end gap-3" method="get" action="/hub/sales-dashboard">
      <label className="grid gap-1 text-xs font-medium text-muted-foreground">Year<select name="year" defaultValue={String(year)} className={styles.select}>{data.availableYears.map((value) => <option key={value} value={String(value)}>{value}</option>)}</select></label>
      <label className="grid gap-1 text-xs font-medium text-muted-foreground">Month<select name="month" defaultValue={month} className={styles.select}>{DASHBOARD_MONTHS.map((name, index) => <option key={name} value={index + 1}>{name}</option>)}</select></label>
      <label className="grid gap-1 text-xs font-medium text-muted-foreground">View<select name="view" defaultValue={view} className={styles.select}><option value="company">Company</option><option value="members">Team Members</option></select></label>
      {member ? <input name="member" type="hidden" value={member} /> : null}
      <input name="dashboardView" type="hidden" value={activeDashboardView} />
      <button className="h-9 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground" type="submit">Apply</button>
      {isAdmin ? <ManualKpiEntry year={year} month={month} targets={data.targets} /> : null}
    </form></Panel>
    {data.setupIssue ? <p role="alert" className="text-sm text-destructive">{data.setupIssue}</p> : null}
    {view === "company" ? <>
      <DashboardNav tabs={DASHBOARD_TABS} value={activeDashboardView} onChange={changeDashboardView} mode="tabs" />
      {activeDashboardView === "overview"
        ? <CompanyKpiView current={data.company} previous={data.previousCompany} targets={data.targets} filters={{ year, month, view, member }} />
        : <YearComparisonChart comparison={data.yearComparison} />}
    </> : data.members.length ? <TeamMemberKpiView rows={data.members} selectedKey={member} query={{ year, month }} /> : <EmptyState title="No team member data" />}
  </div></MetricDashboardProvider>;
}
