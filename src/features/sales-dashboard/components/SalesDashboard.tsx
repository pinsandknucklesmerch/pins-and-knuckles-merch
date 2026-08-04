"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardNav } from "metricui";
import { ActionButton } from "@/components/ui/ActionButton";
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
import { YearToDateView } from "./YearToDateView";
import { ExportMetricsButton } from "./ExportMetricsButton";
import { MonthlyKpiFinals } from "./MonthlyKpiFinals";
import type { DashboardView } from "../lib/dashboardView";
import { SnuggleView } from "./SnuggleView";
import { ProfitPdfReport } from "./ProfitPdfReport";
import { SalesDashboardTvView } from "./SalesDashboardTvView";
import { buildTvModeUrl, DEFAULT_TV_DURATION_SECONDS } from "../lib/tvMode";


const DASHBOARD_TABS = [
  { value: "overview", label: "Overview" },
  { value: "ytd", label: "YTD" },
  { value: "year-comparison", label: "Year Comparison" },
  { value: "snuggle", label: "Snuggle" },
];

export function SalesDashboard({ data, year, month, view, member, isAdmin, initialDashboardView, tvMode = false, tvDurationSeconds = DEFAULT_TV_DURATION_SECONDS }: { data: SalesDashboardData; year: number; month: number; view: "company" | "members"; member?: string; isAdmin: boolean; initialDashboardView: DashboardView; tvMode?: boolean; tvDurationSeconds?: number }) {
  const router = useRouter();
  const [activeDashboardView, setActiveDashboardView] = useState<DashboardView>(initialDashboardView);
  const dashboardMetricsRef = useRef<HTMLDivElement>(null);
  const profitReportRef = useRef<HTMLDivElement>(null);
  const companyMetrics = useMemo(() => calculateCompanyMetrics(data.company, data.previousCompany, data.targets), [data.company, data.previousCompany, data.targets]);
  const monthlyProfitMetric = companyMetrics.find(
  (metric) => metric.code === "MONTHLY_PROFIT",);
      if (!monthlyProfitMetric) {
        throw new Error("Monthly Profit metric is unavailable.");
      }
        const exportRows = useMemo(() => buildMetricExportRows(
          data.company,
          companyMetrics,
          { year, month, view, member },
        ), [data.company, companyMetrics, year, month, view, member]);
const conversionRateMetric = companyMetrics.find(
  (metric) => metric.code === "CONVERSION_RATE",
);

if (!conversionRateMetric) {
  throw new Error("Conversion Rate metric is unavailable.");
}
  const changeDashboardView = useCallback((value: string) => {
    const nextView: DashboardView = value === "year-comparison" ? "year-comparison" : value === "ytd" ? "ytd" : value === "snuggle" ? "snuggle" : "overview";
    setActiveDashboardView((currentView) => currentView === nextView ? currentView : nextView);
  }, []);
  const exportTitle = `Pins Sales Metrics — ${DASHBOARD_MONTHS[month - 1]} ${year} — ${activeDashboardView === "year-comparison" ? "Year Comparison" : activeDashboardView === "ytd" ? "YTD" : "Overview"}`;

  const enterTvMode = useCallback(() => {
    router.push(buildTvModeUrl({ year, month, view, member, durationSeconds: tvDurationSeconds }));
  }, [member, month, router, tvDurationSeconds, view, year]);

  if (tvMode) return <MetricDashboardProvider><SalesDashboardTvView data={data} year={year} month={month} view={view} member={member} companyMetrics={companyMetrics} monthlyProfitMetric={monthlyProfitMetric} durationSeconds={tvDurationSeconds} /></MetricDashboardProvider>;

  return <MetricDashboardProvider><div className="grid gap-3">
    <Panel><div className="flex flex-wrap items-end gap-3">
      <form data-testid="sales-dashboard-filter-form" className="flex flex-wrap items-end gap-3" method="get" action="/hub/sales-dashboard">
        <label className="grid min-w-[5.5rem] gap-1 text-xs font-medium text-muted-foreground">Year<Select className="min-w-[5.5rem]" name="year" defaultValue={String(year)}>{data.availableYears.map((value) => <option key={value} value={String(value)}>{value}</option>)}</Select></label>
        <label className="grid min-w-[8rem] gap-1 text-xs font-medium text-muted-foreground">Month<Select className="min-w-[8rem]" name="month" defaultValue={String(month)}>{DASHBOARD_MONTHS.map((name, index) => <option key={name} value={String(index + 1)}>{name}</option>)}</Select></label>
        <label className="grid min-w-[9rem] gap-1 text-xs font-medium text-muted-foreground">View<Select className="min-w-[9rem]" name="view" defaultValue={view}><option value="company">Company</option><option value="members">Team Members</option></Select></label>
        {member ? <input name="member" type="hidden" value={member} /> : null}
        <input name="dashboardView" type="hidden" value={activeDashboardView} />
        <button className="h-9 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground" type="submit">Apply</button>
      </form>
      <div data-testid="sales-dashboard-actions" className="flex flex-wrap items-center gap-3">
        {isAdmin ? <ManualKpiEntry year={year} month={month} targets={data.targets} /> : null}
        {view === "company" && isAdmin ? <MonthlyKpiFinals metrics={companyMetrics} year={year} month={month} isAdmin={isAdmin} /> : null}

        <ExportMetricsButton
          rows={exportRows}
          targetRef={dashboardMetricsRef}
          profitTargetRef={profitReportRef}
          title={exportTitle}
          profitFilename={`pins-profit-report-${DASHBOARD_MONTHS[month - 1].toLowerCase()}-${year}.pdf`}
        />
        <ActionButton onClick={enterTvMode}>TV Mode</ActionButton>

      </div>
    </div></Panel>
    <div ref={dashboardMetricsRef} data-testid="sales-dashboard-export-content" className="grid gap-3">
      {data.setupIssue ? <p role="alert" className="text-sm text-destructive">{data.setupIssue}</p> : null}
      <DashboardNav tabs={DASHBOARD_TABS} value={activeDashboardView} onChange={changeDashboardView} mode="tabs" />
      {activeDashboardView === "snuggle" ? <SnuggleView data={data.snuggle} year={year} month={month} view={view} member={member} /> : view === "company" ? <>{activeDashboardView === "overview" ? <CompanyKpiView current={data.company} metrics={companyMetrics} /> : activeDashboardView === "ytd" ? <YearToDateView data={data.yearToDate} /> : <YearComparisonChart comparison={data.yearComparison} />}</> : data.members.length ? <TeamMemberKpiView rows={data.members} selectedKey={member} query={{ year, month }} /> : <EmptyState title="No team member data" />}
    </div>
    <div
      aria-hidden="true"
      className="pointer-events-none fixed left-[-12000px] top-0 w-[1100px]"
    >
      <div ref={profitReportRef}>
        <ProfitPdfReport
          year={year}
          month={month}
          monthlyProfitMetric={monthlyProfitMetric}
          conversionRateMetric={conversionRateMetric}
          yearToDate={data.yearToDate}
          yearComparison={data.yearComparison}
        />
      </div>
    </div>
    
  </div></MetricDashboardProvider>;
}
