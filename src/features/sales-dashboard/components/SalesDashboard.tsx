"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { DashboardNav } from "metricui";
import { Panel } from "@/components/ui/Panel";
import { Select } from "@/components/ui/Select";
import { EmptyState } from "@/components/ui/EmptyState";
import { DASHBOARD_MONTHS } from "../types";
import type { SalesDashboardData } from "../domain/types";
import { calculateCompanyMetrics } from "../domain/calculateDashboardKpis";
import { buildMetricExportRows } from "../lib/metricsExport";
import { CompanyKpiView } from "./CompanyKpiView";
import { TeamMemberKpiView } from "./TeamMemberKpiView";
import { ManualKpiEntry } from "./ManualKpiEntry";
import { MetricDashboardProvider } from "./MetricDashboardProvider";
import { YearComparisonChart } from "./YearComparisonChart";
import { ExportMetricsButton } from "./ExportMetricsButton";
import type { DashboardView } from "../lib/dashboardView";

const DASHBOARD_TABS = [
  { value: "overview", label: "Overview" },
  { value: "year-comparison", label: "Year Comparison" },
];

export function SalesDashboard({ data, year, month, view, member, isAdmin, initialDashboardView }: { data: SalesDashboardData; year: number; month: number; view: "company" | "members"; member?: string; isAdmin: boolean; initialDashboardView: DashboardView }) {
  const [activeDashboardView, setActiveDashboardView] = useState<DashboardView>(initialDashboardView);
  const dashboardMetricsRef = useRef<HTMLDivElement>(null);
  const exportRows = useMemo(() => buildMetricExportRows(
    data.company,
    calculateCompanyMetrics(data.company, data.previousCompany, data.targets),
    { year, month, view, member },
  ), [data.company, data.previousCompany, data.targets, year, month, view, member]);
  const changeDashboardView = useCallback((value: string) => {
    const nextView = value === "year-comparison" ? "year-comparison" : "overview";
    setActiveDashboardView((currentView) => currentView === nextView ? currentView : nextView);
  }, []);
  const exportTitle = `Pins Sales Metrics — ${DASHBOARD_MONTHS[month - 1]} ${year} — ${activeDashboardView === "year-comparison" ? "Year Comparison" : "Overview"}`;

  return <MetricDashboardProvider><div className="grid gap-3">
    <Panel><div className="flex flex-wrap items-end gap-3">
      <form data-testid="sales-dashboard-filter-form" className="flex flex-wrap items-end gap-3" method="get" action="/hub/sales-dashboard">
        <label className="grid gap-1 text-xs font-medium text-muted-foreground">Year<Select name="year" defaultValue={String(year)}>{data.availableYears.map((value) => <option key={value} value={String(value)}>{value}</option>)}</Select></label>
        <label className="grid gap-1 text-xs font-medium text-muted-foreground">Month<Select name="month" defaultValue={String(month)}>{DASHBOARD_MONTHS.map((name, index) => <option key={name} value={String(index + 1)}>{name}</option>)}</Select></label>
        <label className="grid gap-1 text-xs font-medium text-muted-foreground">View<Select name="view" defaultValue={view}><option value="company">Company</option><option value="members">Team Members</option></Select></label>
        {member ? <input name="member" type="hidden" value={member} /> : null}
        <input name="dashboardView" type="hidden" value={activeDashboardView} />
        <button className="h-9 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground" type="submit">Apply</button>
      </form>
      <div data-testid="sales-dashboard-actions" className="flex items-center gap-3">
        {isAdmin ? <ManualKpiEntry year={year} month={month} targets={data.targets} /> : null}
        <ExportMetricsButton rows={exportRows} targetRef={dashboardMetricsRef} title={exportTitle} />
      </div>
    </div></Panel>
    <div ref={dashboardMetricsRef} data-testid="sales-dashboard-export-content" className="grid gap-3">
      {data.setupIssue ? <p role="alert" className="text-sm text-destructive">{data.setupIssue}</p> : null}
      {view === "company" ? <>
        <DashboardNav tabs={DASHBOARD_TABS} value={activeDashboardView} onChange={changeDashboardView} mode="tabs" />
        {activeDashboardView === "overview"
          ? <CompanyKpiView current={data.company} previous={data.previousCompany} targets={data.targets} />
          : <YearComparisonChart comparison={data.yearComparison} />}
      </> : data.members.length ? <TeamMemberKpiView rows={data.members} selectedKey={member} query={{ year, month }} /> : <EmptyState title="No team member data" />}
    </div>
  </div></MetricDashboardProvider>;
}
