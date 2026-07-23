import { Panel } from "@/components/ui/Panel";
import { EmptyState } from "@/components/ui/EmptyState";
import { DASHBOARD_MONTHS } from "../types";
import type { SalesDashboardData } from "../domain/types";
import { CompanyKpiView } from "./CompanyKpiView";
import { TeamMemberKpiView } from "./TeamMemberKpiView";
import { ManualKpiEntry } from "./ManualKpiEntry";
import { MetricDashboardProvider } from "./MetricDashboardProvider";
import { YearComparisonChart } from "./YearComparisonChart";
import styles from "./SalesDashboard.module.css";

export function SalesDashboard({ data, year, month, view, member, isAdmin }: { data: SalesDashboardData; year: number; month: number; view: "company" | "members"; member?: string; isAdmin: boolean }) {
  return <MetricDashboardProvider><div className="grid gap-3">
    <Panel><form className="flex flex-wrap items-end gap-3" method="get" action="/hub/sales-dashboard">
      <label className="grid gap-1 text-xs font-medium text-muted-foreground">Year<select name="year" defaultValue={String(year)} className={styles.select}>{data.availableYears.map((value) => <option key={value} value={String(value)}>{value}</option>)}</select></label>
      <label className="grid gap-1 text-xs font-medium text-muted-foreground">Month<select name="month" defaultValue={month} className={styles.select}>{DASHBOARD_MONTHS.map((name, index) => <option key={name} value={index + 1}>{name}</option>)}</select></label>
      <label className="grid gap-1 text-xs font-medium text-muted-foreground">View<select name="view" defaultValue={view} className={styles.select}><option value="company">Company</option><option value="members">Team Members</option></select></label>
      {member ? <input name="member" type="hidden" value={member} /> : null}
      <button className="h-9 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground" type="submit">Apply</button>
    </form></Panel>
    {data.setupIssue ? <p role="alert" className="text-sm text-destructive">{data.setupIssue}</p> : null}
    {isAdmin ? <ManualKpiEntry year={year} month={month} targets={data.targets} /> : null}
    {view === "company" ? <><CompanyKpiView current={data.company} previous={data.previousCompany} targets={data.targets} /><YearComparisonChart comparison={data.yearComparison} /></> : data.members.length ? <TeamMemberKpiView rows={data.members} selectedKey={member} query={{ year, month }} /> : <EmptyState title="No team member data" />}
  </div></MetricDashboardProvider>;
}
