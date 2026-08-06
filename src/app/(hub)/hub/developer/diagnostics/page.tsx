import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { ErrorState } from "@/components/ui/ErrorState";
import { PageHeader } from "@/components/layout/PageHeader";
import { DiagnosticsInbox } from "@/features/developer-diagnostics/components/DiagnosticsInbox";
import { loadDiagnosticIssues } from "@/features/developer-diagnostics/data/issues";
import { syncSnuggleDiagnosticIssues } from "@/features/developer-diagnostics/server/syncSnuggleDiagnostics";
import { getSnuggleProfit } from "@/features/sales-dashboard/server/snuggleProfit";
import { getCurrentPinsHubAccess, hasDeveloperAccess } from "@/lib/access/pinsHubAccess";
import { nativeControlClassName, nativeSelectClassName } from "@/components/ui/styles";

type Props = { searchParams: Promise<{ status?: string; issueType?: string; month?: string; detection?: string }> };
export default async function DiagnosticsPage({ searchParams }: Props) {
  const [access, params] = await Promise.all([getCurrentPinsHubAccess(), searchParams]); if (!hasDeveloperAccess(access) || !access.membership?.organisation_id) redirect("/hub");
  const source = await getSnuggleProfit(); if (!source.error) await syncSnuggleDiagnosticIssues(access.membership.organisation_id, source.warnings);
  const data = await loadDiagnosticIssues(params);
  return <AppShell pinsHubAccess={access}><PageHeader title="Diagnostics" /><form method="get" className="flex flex-wrap gap-2"><select name="status" defaultValue={params.status ?? ""} className={nativeSelectClassName}><option value="">Open and investigating</option><option value="open">Open</option><option value="investigating">Investigating</option><option value="resolved">Resolved</option><option value="ignored">Ignored</option></select><select name="issueType" defaultValue={params.issueType ?? ""} className={nativeSelectClassName}><option value="">All issue types</option><option value="unassigned">Unassigned</option><option value="unmapped">Unmapped</option><option value="multi_assignee">Multi-assignee</option><option value="invalid_formula_value">Invalid formula/value</option><option value="excluded_from_member_attribution">Excluded attribution</option></select><input name="month" placeholder="YYYY-MM" defaultValue={params.month ?? ""} className={`${nativeControlClassName} w-28`} /><select name="detection" defaultValue={params.detection ?? ""} className={nativeSelectClassName}><option value="">All detection states</option><option value="current">Currently detected</option><option value="stale">No longer detected</option></select><button className="h-9 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground">Filter</button></form>{source.error ? <ErrorState title="Snuggle data unavailable" message={source.error} /> : data.error ? <ErrorState title="Diagnostics unavailable" message={data.error} /> : <DiagnosticsInbox issues={data.issues} />}</AppShell>;
}
