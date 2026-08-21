"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardNav } from "metricui";
import { ActionButton } from "@/components/ui/ActionButton";
import { Panel } from "@/components/ui/Panel";
import { Select } from "@/components/ui/Select";
import { DASHBOARD_MONTHS } from "../types";
import type { SalesDashboardData } from "../domain/types";
import { calculateCompanyMetrics } from "../domain/calculateDashboardKpis";
import { buildMetricExportRows } from "../lib/metricsExport";
import { CompanyKpiView } from "./CompanyKpiView";
import { CompanyProfitView } from "./CompanyProfitView";
import { ManualKpiEntry } from "./ManualKpiEntry";
import { MetricDashboardProvider } from "./MetricDashboardProvider";
import { YearToDateView } from "./YearToDateView";
import { ExportMetricsButton } from "./ExportMetricsButton";
import { MonthlyKpiFinals } from "./MonthlyKpiFinals";
import type { DashboardView } from "../lib/dashboardView";
import { SnuggleView } from "./SnuggleView";
import { ProfitPdfReport } from "./ProfitPdfReport";
import { SalesDashboardTvView } from "./SalesDashboardTvView";
import { TeamMembersTab } from "./TeamMembersTab";
import { SalesDashboardStaleWarning } from "./SalesDashboardStaleWarning";
import { buildTvModeUrl, DEFAULT_TV_DURATION_SECONDS } from "../lib/tvMode";
import type { SalesDashboardStaleWarning as StaleWarning } from "../lib/cronRunStatus";
import styles from "./SalesDashboard.module.css";


const DASHBOARD_TABS = [
  { value: "overview", label: "Overview" },
  { value: "company-profit", label: "Company Profit" },
  { value: "ytd", label: "YTD" },
  { value: "snuggle", label: "Snuggle" },
  { value: "team-members", label: "Team Members" },
];

export function SalesDashboard({ data, year, month, isAdmin, initialDashboardView, staleWarnings = [], tvMode = false, tvDurationSeconds = DEFAULT_TV_DURATION_SECONDS }: { data: SalesDashboardData; year: number; month: number; isAdmin: boolean; initialDashboardView: DashboardView; staleWarnings?: StaleWarning[]; tvMode?: boolean; tvDurationSeconds?: number }) {
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
          { year, month },
        ), [data.company, companyMetrics, year, month]);
const conversionRateMetric = companyMetrics.find(
  (metric) => metric.code === "CONVERSION_RATE",
);

if (!conversionRateMetric) {
  throw new Error("Conversion Rate metric is unavailable.");
}
  const changeDashboardView = useCallback((value: string) => {
    const nextView: DashboardView = value === "company-profit" ? "company-profit" : value === "ytd" ? "ytd" : value === "snuggle" ? "snuggle" : value === "team-members" ? "team-members" : "overview";
    setActiveDashboardView((currentView) => currentView === nextView ? currentView : nextView);
  }, []);
  const exportTitle = `Pins Sales Metrics — ${DASHBOARD_MONTHS[month - 1]} ${year} — ${activeDashboardView === "company-profit" ? "Company Profit" : activeDashboardView === "ytd" ? "YTD" : activeDashboardView === "snuggle" ? "Snuggle" : activeDashboardView === "team-members" ? "Team Members" : "Overview"}`;

  const enterTvMode = useCallback(() => {
    router.push(buildTvModeUrl({ year, month, durationSeconds: tvDurationSeconds }));
  }, [month, router, tvDurationSeconds, year]);

  if (tvMode) return <MetricDashboardProvider><SalesDashboardTvView data={data} year={year} month={month} companyMetrics={companyMetrics} monthlyProfitMetric={monthlyProfitMetric} durationSeconds={tvDurationSeconds} /></MetricDashboardProvider>;

  const isOverviewView = activeDashboardView === "overview";
  const isYtdView = activeDashboardView === "ytd";

  return <MetricDashboardProvider><div className={isYtdView ? styles.ytdRoot : styles.dashboardRoot}>
    <header className={styles.dashboardHeader}>
      <h1>Sales Dashboard</h1>
      <div className={styles.dashboardTabs}><DashboardNav className={styles.dashboardNav} tabs={DASHBOARD_TABS} value={activeDashboardView} onChange={changeDashboardView} mode="tabs" /></div>
    </header>
    {isOverviewView ? <Panel><div className={styles.controlSurface}>
      <div className={styles.controlGroup} role="group" aria-labelledby="sales-dashboard-period-label" data-testid="sales-dashboard-period-group">
        <span className={styles.groupLabel} id="sales-dashboard-period-label">Period</span>
        <form data-testid="sales-dashboard-filter-form" className={styles.periodForm} method="get" action="/hub/sales-dashboard">
          <label className="grid min-w-[5.5rem] gap-1 text-xs font-medium text-muted-foreground"><span className={styles.fieldLabel}>Year</span><Select aria-label="Year" className="min-w-[5.5rem]" name="year" defaultValue={String(year)}>{data.availableYears.map((value) => <option key={value} value={String(value)}>{value}</option>)}</Select></label>
          <label className="grid min-w-[8rem] gap-1 text-xs font-medium text-muted-foreground"><span className={styles.fieldLabel}>Month</span><Select aria-label="Month" className="min-w-[8rem]" name="month" defaultValue={String(month)}>{DASHBOARD_MONTHS.map((name, index) => <option key={name} value={String(index + 1)}>{name}</option>)}</Select></label>
          <input name="dashboardView" type="hidden" value={activeDashboardView} />
          <button className={styles.applyButton} type="submit">Apply</button>
        </form>
      </div>
      <div className={styles.controlGroup} role="group" aria-labelledby="sales-dashboard-management-label" data-testid="sales-dashboard-management-group">
        <span className={styles.groupLabel} id="sales-dashboard-management-label">Dashboard</span>
        <div className={styles.groupControls}>
          {isAdmin ? <ManualKpiEntry year={year} month={month} targets={data.targets} /> : null}
          {isAdmin ? <MonthlyKpiFinals metrics={companyMetrics} year={year} month={month} isAdmin={isAdmin} /> : null}
        </div>
      </div>
      <div className={styles.controlGroup} role="group" aria-labelledby="sales-dashboard-actions-label" data-testid="sales-dashboard-actions">
        <span className={styles.groupLabel} id="sales-dashboard-actions-label">Actions</span>
        <div className={styles.groupControls}>
          <ExportMetricsButton
            rows={exportRows}
            targetRef={dashboardMetricsRef}
            profitTargetRef={profitReportRef}
            title={exportTitle}
            profitFilename={`pins-profit-report-${DASHBOARD_MONTHS[month - 1].toLowerCase()}-${year}.pdf`}
          />
          <ActionButton onClick={enterTvMode}>TV Mode</ActionButton>
        </div>
      </div>
      </div></Panel> : null}
    <div ref={dashboardMetricsRef} data-testid="sales-dashboard-export-content" className={isYtdView ? styles.ytdDashboardContent : styles.dashboardContent}>
      {staleWarnings.length || data.setupIssue ? <div className={styles.dashboardNotices}><SalesDashboardStaleWarning warnings={staleWarnings} />{data.setupIssue ? <p role="alert" className="text-sm text-destructive">{data.setupIssue}</p> : null}</div> : null}
      <div className={styles.dashboardView}>{activeDashboardView === "snuggle" ? <SnuggleView data={data.snuggle} year={year} month={month} isAdmin={isAdmin} /> : activeDashboardView === "team-members" ? <TeamMembersTab data={data} year={year} month={month} /> : activeDashboardView === "company-profit" ? <CompanyProfitView metric={monthlyProfitMetric} /> : activeDashboardView === "ytd" ? <YearToDateView data={data.yearToDate} comparison={data.yearComparison} /> : <CompanyKpiView current={data.company} metrics={companyMetrics} />}</div>
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
