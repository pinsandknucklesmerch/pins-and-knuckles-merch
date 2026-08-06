"use client";

import { useRef, useState } from "react";
import { submitFeedbackReport } from "../actions";
import { feedback } from "@/components/ui/feedback";
import { Select } from "@/components/ui/Select";

export function ReportIssueDialog({ children, triggerClassName }: { children: React.ReactNode; triggerClassName: string }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [pending, setPending] = useState(false);
  async function submit(formData: FormData) {
    setPending(true);
    const result = await submitFeedbackReport({ issueType: String(formData.get("issue_type") ?? ""), comment: String(formData.get("comment") ?? ""), attemptedAction: String(formData.get("attempted_action") ?? ""), pageRoute: window.location.pathname, userAgent: navigator.userAgent });
    setPending(false);
    if (result.ok) { feedback.success(result.message); dialogRef.current?.close(); }
    else feedback.error(result.message);
  }
  return <><button type="button" onClick={() => dialogRef.current?.showModal()} className={triggerClassName}>{children}</button><dialog ref={dialogRef} className="w-[min(30rem,calc(100%-2rem)] rounded-lg border border-border bg-card p-0 text-foreground backdrop:bg-black/70"><form action={submit} className="grid gap-3 p-4"><div className="flex items-center justify-between gap-4"><h2 className="text-base font-semibold">Report an issue</h2><button type="button" onClick={() => dialogRef.current?.close()} className="text-sm text-muted-foreground hover:text-foreground">Close</button></div><label className="grid gap-1 text-sm">Issue type<Select name="issue_type" defaultValue="bug"><option value="bug">Bug</option><option value="incorrect_data">Incorrect data</option><option value="suggestion">Suggestion</option><option value="other">Other</option></Select></label><label className="grid gap-1 text-sm">Comment<textarea required name="comment" maxLength={4000} className="hub-native-control min-h-24 h-auto py-2" /></label><label className="grid gap-1 text-sm">What were you trying to do?<textarea name="attempted_action" maxLength={2000} className="hub-native-control min-h-16 h-auto py-2" /></label><div className="flex justify-end gap-2"><button type="button" onClick={() => dialogRef.current?.close()} className="h-9 rounded-md px-3 text-sm hover:bg-muted">Cancel</button><button disabled={pending} className="h-9 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground disabled:opacity-60">{pending ? "Sending…" : "Submit"}</button></div></form></dialog></>;
}
