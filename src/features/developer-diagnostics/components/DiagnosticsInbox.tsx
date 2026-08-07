"use client";

import { Dialog } from "@/components/ui/Dialog";
import { feedback } from "@/components/ui/feedback";
import { nativeSelectClassName } from "@/components/ui/styles";
import { useState } from "react";
import { updateDiagnosticIssue } from "../actions";
import type { DeveloperDiagnosticIssue, DiagnosticStatus } from "../types";

const label = (value: string) => value.replaceAll("_", " ");
const date = (value: string | null) => value ? new Date(value).toLocaleString("en-GB") : "—";

export function DiagnosticsInbox({ issues }: { issues: DeveloperDiagnosticIssue[] }) {
  const [selected, setSelected] = useState<DeveloperDiagnosticIssue | null>(null);
  const [pending, setPending] = useState(false);

  async function save(data: FormData) {
    if (!selected) return;
    setPending(true);
    const result = await updateDiagnosticIssue({ id: selected.id, status: String(data.get("status")) as DiagnosticStatus, notes: String(data.get("developer_notes") ?? "") });
    setPending(false);
    if (result.ok) { feedback.success(result.message); setSelected(null); }
    else feedback.error(result.message);
  }

  if (!issues.length) return <p className="rounded-md border border-border bg-card/50 p-4 text-sm text-muted-foreground">No diagnostic issues match these filters.</p>;

  return <>
    <div className="overflow-x-auto rounded-md border border-border"><table className="w-full min-w-[1000px] text-left text-sm"><thead className="bg-muted/40 text-muted-foreground"><tr><th scope="col" className="p-3">View</th><th scope="col" className="p-3">Month</th><th scope="col" className="p-3">Issue</th><th scope="col" className="p-3">Summary</th><th scope="col" className="p-3">Count</th><th scope="col" className="p-3">Detected</th><th scope="col" className="p-3">Status</th></tr></thead><tbody>{issues.map((issue) => <tr key={issue.id} className="border-t border-border/70 hover:bg-muted/30"><td className="p-2"><button type="button" onClick={() => setSelected(issue)} className="inline-flex min-h-8 items-center rounded-md px-2 text-sm font-medium text-primary hover:bg-primary/10 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">View</button></td><td className="p-3">{issue.reporting_year}-{String(issue.reporting_month).padStart(2, "0")}</td><td className="p-3 capitalize">{label(issue.issue_type)}</td><td className="max-w-md truncate p-3">{issue.summary}</td><td className="p-3">{issue.occurrence_count}</td><td className="p-3">{issue.no_longer_detected_at ? "No longer detected" : "Currently detected"}</td><td className="p-3 capitalize">{issue.status}</td></tr>)}</tbody></table></div>
    <Dialog open={Boolean(selected)} onClose={() => setSelected(null)} title="Diagnostic issue" description="Review and update the diagnostic issue.">
      {selected ? <form action={save} className="grid max-h-[calc(100dvh-10rem)] gap-3 overflow-y-auto"><dl className="grid gap-2 text-sm sm:grid-cols-2"><div><dt className="text-muted-foreground">Reporting month</dt><dd>{selected.reporting_year}-{String(selected.reporting_month).padStart(2, "0")}</dd></div><div><dt className="text-muted-foreground">Count</dt><dd>{selected.occurrence_count}</dd></div><div><dt className="text-muted-foreground">Affected item</dt><dd>{selected.affected_item_id ?? "—"}</dd></div><div><dt className="text-muted-foreground">Affected member</dt><dd>{selected.affected_member_key ?? "—"}</dd></div><div><dt className="text-muted-foreground">First detected</dt><dd>{date(selected.first_detected_at)}</dd></div><div><dt className="text-muted-foreground">Last detected</dt><dd>{date(selected.last_detected_at)}</dd></div><div><dt className="text-muted-foreground">Detection state</dt><dd>{selected.no_longer_detected_at ? `No longer detected ${date(selected.no_longer_detected_at)}` : "Currently detected"}</dd></div><div><dt className="text-muted-foreground">Resolved</dt><dd>{date(selected.resolved_at)}</dd></div></dl><p className="rounded-md bg-muted/40 p-3 text-sm">{selected.summary}</p><label className="grid gap-1 text-sm">Status<select name="status" defaultValue={selected.status} className={nativeSelectClassName}><option value="open">Open</option><option value="investigating">Investigating</option><option value="resolved">Resolved</option><option value="ignored">Ignored</option></select></label><label className="grid gap-1 text-sm">Developer notes<textarea name="developer_notes" defaultValue={selected.developer_notes ?? ""} maxLength={4000} className="hub-native-control min-h-24 h-auto py-2" /></label><div className="flex justify-end gap-2"><button type="button" onClick={() => setSelected(null)} className="h-9 rounded-md px-3 text-sm hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Cancel</button><button disabled={pending} className="h-9 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60">{pending ? "Saving…" : "Save"}</button></div></form> : null}
    </Dialog>
  </>;
}
