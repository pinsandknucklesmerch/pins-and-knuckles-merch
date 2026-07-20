import { Panel } from "@/components/ui/Panel";
import { EmptyState } from "@/components/ui/EmptyState";
import { DASHBOARD_MONTHS } from "../types";
import type { SalesDashboardData } from "../domain/types";
import { CompanyKpiView } from "./CompanyKpiView";
import { TeamMemberKpiView } from "./TeamMemberKpiView";
import { ManualKpiEntry } from "./ManualKpiEntry";

export function SalesDashboard({ data, year, month, view, member, isAdmin }: { data: SalesDashboardData; year: number; month: number; view: "company" | "members"; member?: string; isAdmin: boolean }) {
  return <div className="grid gap-4">
    <Panel><form className="flex flex-wrap items-end gap-3" method="get">
      <label className="grid gap-1 text-xs font-medium text-muted-foreground">Year<select name="year" defaultValue={year} className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground">{data.availableYears.map((value) => <option key={value}>{value}</option>)}</select></label>
      <label className="grid gap-1 text-xs font-medium text-muted-foreground">Month<select name="month" defaultValue={month} className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground">{DASHBOARD_MONTHS.map((name, index) => <option key={name} value={index + 1}>{name}</option>)}</select></label>
      <label className="grid gap-1 text-xs font-medium text-muted-foreground">View<select name="view" defaultValue={view} className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground"><option value="company">Company</option><option value="members">Team Members</option></select></label>
      <button className="h-9 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground" type="submit">Apply</button>
    </form></Panel>
    {data.setupIssue ? <p role="alert" className="text-sm text-destructive">{data.setupIssue}</p> : null}
    {isAdmin ? <ManualKpiEntry year={year} month={month} company={data.company} /> : null}
    {view === "company" ? <CompanyKpiView current={data.company} previous={data.previousCompany} targets={data.targets} /> : data.members.length ? <TeamMemberKpiView rows={data.members} selectedKey={member} query={{ year, month }} /> : <EmptyState title="No team member data" />}
  </div>;
}
