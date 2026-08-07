"use client";

import { Dialog } from "@/components/ui/Dialog";
import { feedback } from "@/components/ui/feedback";
import { nativeSelectClassName } from "@/components/ui/styles";
import { useState } from "react";
import { updateFeedbackReport } from "../actions";
import type { FeedbackReport, FeedbackStatus } from "../types";

const label = (value: string) => value.replaceAll("_", " ");

export function FeedbackInbox({ reports }: { reports: FeedbackReport[] }) {
  const [selected, setSelected] = useState<FeedbackReport | null>(null);
  const [pending, setPending] = useState(false);

  async function save(formData: FormData) {
    if (!selected) return;
    setPending(true);
    const result = await updateFeedbackReport({ id: selected.id, status: String(formData.get("status")) as FeedbackStatus, developerNotes: String(formData.get("developer_notes") ?? "") });
    setPending(false);
    if (result.ok) { feedback.success(result.message); setSelected(null); }
    else feedback.error(result.message);
  }

  if (!reports.length) return <p className="rounded-md border border-border bg-card/50 p-4 text-sm text-muted-foreground">No feedback reports match these filters.</p>;

  return <>
    <div className="overflow-x-auto rounded-md border border-border">
      <table className="w-full min-w-[820px] text-left text-sm">
        <thead className="bg-muted/40 text-muted-foreground"><tr>
          <th scope="col" className="p-3 font-medium">View</th><th scope="col" className="p-3 font-medium">Submitted</th><th scope="col" className="p-3 font-medium">By</th><th scope="col" className="p-3 font-medium">Type</th><th scope="col" className="p-3 font-medium">Route</th><th scope="col" className="p-3 font-medium">Comment</th><th scope="col" className="p-3 font-medium">Status</th>
        </tr></thead>
        <tbody>{reports.map((report) => <tr key={report.id} className="border-t border-border/70 hover:bg-muted/30">
          <td className="p-2"><button type="button" onClick={() => setSelected(report)} className="inline-flex min-h-8 items-center rounded-md px-2 text-sm font-medium text-primary hover:bg-primary/10 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">View</button></td>
          <td className="p-3">{new Date(report.created_at).toLocaleString("en-GB")}</td><td className="p-3">{report.submitter_name ?? report.submitted_by}</td><td className="p-3 capitalize">{label(report.issue_type)}</td><td className="p-3 font-mono text-xs">{report.page_route}</td><td className="max-w-sm truncate p-3">{report.comment}</td><td className="p-3 capitalize">{label(report.status)}</td>
        </tr>)}</tbody>
      </table>
    </div>
    <Dialog open={Boolean(selected)} onClose={() => setSelected(null)} title="Feedback report" description="Review and update the submitted feedback report.">
      {selected ? <form action={save} className="grid max-h-[calc(100dvh-10rem)] gap-3 overflow-y-auto">
        <dl className="grid gap-2 text-sm sm:grid-cols-2"><div><dt className="text-muted-foreground">Submitted</dt><dd>{new Date(selected.created_at).toLocaleString("en-GB")}</dd></div><div><dt className="text-muted-foreground">Submitted by</dt><dd>{selected.submitter_name ?? selected.submitted_by}</dd></div><div><dt className="text-muted-foreground">Route</dt><dd className="break-all font-mono text-xs">{selected.page_route}</dd></div><div><dt className="text-muted-foreground">Browser</dt><dd className="break-words text-xs">{selected.user_agent ?? "Unavailable"}</dd></div></dl>
        <div className="grid gap-1 text-sm"><span className="text-muted-foreground">Comment</span><p className="whitespace-pre-wrap rounded-md bg-muted/40 p-3">{selected.comment}</p></div>
        {selected.attempted_action ? <div className="grid gap-1 text-sm"><span className="text-muted-foreground">Attempted action</span><p className="whitespace-pre-wrap rounded-md bg-muted/40 p-3">{selected.attempted_action}</p></div> : null}
        <label className="grid gap-1 text-sm">Status<select name="status" defaultValue={selected.status} className={nativeSelectClassName}><option value="new">New</option><option value="in_progress">In progress</option><option value="resolved">Resolved</option><option value="closed">Closed</option></select></label><label className="grid gap-1 text-sm">Developer notes<textarea name="developer_notes" defaultValue={selected.developer_notes ?? ""} maxLength={4000} className="hub-native-control min-h-24 h-auto py-2" /></label>
        <div className="flex justify-end gap-2"><button type="button" onClick={() => setSelected(null)} className="h-9 rounded-md px-3 text-sm hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Cancel</button><button disabled={pending} className="h-9 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60">{pending ? "Saving…" : "Save"}</button></div>
      </form> : null}
    </Dialog>
  </>;
}
