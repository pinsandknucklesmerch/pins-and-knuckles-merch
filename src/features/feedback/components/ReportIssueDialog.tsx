"use client";

import { useState } from "react";
import { Dialog } from "@/components/ui/Dialog";
import { submitFeedbackReport } from "../actions";
import { feedback } from "@/components/ui/feedback";
import { Select } from "@/components/ui/Select";

export function ReportIssueDialog({ children, triggerClassName }: { children: React.ReactNode; triggerClassName: string }) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  async function submit(formData: FormData) {
    setPending(true);
    const result = await submitFeedbackReport({ issueType: String(formData.get("issue_type") ?? ""), comment: String(formData.get("comment") ?? ""), attemptedAction: String(formData.get("attempted_action") ?? ""), pageRoute: window.location.pathname, userAgent: navigator.userAgent });
    setPending(false);
    if (result.ok) { feedback.success(result.message); setOpen(false); }
    else feedback.error(result.message);
  }
  return <><button type="button" onClick={() => setOpen(true)} className={triggerClassName}>{children}</button><Dialog open={open} onClose={() => setOpen(false)} title="Report an issue"><form action={submit} className="grid gap-3"><label className="grid gap-1 text-sm">Issue type<Select name="issue_type" defaultValue="bug"><option value="bug">Bug</option><option value="incorrect_data">Incorrect data</option><option value="suggestion">Suggestion</option><option value="other">Other</option></Select></label><label className="grid gap-1 text-sm">Comment<textarea required name="comment" maxLength={4000} className="hub-native-control min-h-24 h-auto py-2" /></label><label className="grid gap-1 text-sm">What were you trying to do?<textarea name="attempted_action" maxLength={2000} className="hub-native-control min-h-16 h-auto py-2" /></label><div className="flex justify-end gap-2"><button type="button" onClick={() => setOpen(false)} className="h-9 rounded-md px-3 text-sm hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Cancel</button><button disabled={pending} className="h-9 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-60">{pending ? "Sending…" : "Submit"}</button></div></form></Dialog></>;
}
