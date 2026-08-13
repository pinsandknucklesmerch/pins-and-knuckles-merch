import type { CronDiagnostic } from "../data/cronRuns";

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-ZA", { dateStyle: "short", timeStyle: "short", timeZone: "UTC" }).format(new Date(value));
}

export function CronDiagnostics({ jobs, error }: { jobs: CronDiagnostic[]; error: string | null }) {
  return <section aria-labelledby="cron-diagnostics-heading" className="mt-5 border-y border-border py-3">
    <div className="mb-2 flex items-center justify-between gap-3"><h2 id="cron-diagnostics-heading" className="text-sm font-semibold">Cron / Scheduled Jobs</h2>{error ? <span className="text-xs text-destructive">{error}</span> : null}</div>
    <div className="overflow-x-auto"><table className="w-full min-w-[920px] text-left text-xs"><thead className="text-muted-foreground"><tr><th className="pb-2 pr-3 font-medium">Job</th><th className="pb-2 pr-3 font-medium">Scheduled (UTC)</th><th className="pb-2 pr-3 font-medium">Status</th><th className="pb-2 pr-3 font-medium">Last attempt</th><th className="pb-2 pr-3 font-medium">Last successful</th><th className="pb-2 pr-3 font-medium">Failure</th><th className="pb-2 font-medium">Data</th></tr></thead><tbody>{jobs.map((job) => <tr key={job.jobName} className="border-t border-border/60 align-top"><td className="py-2 pr-3 font-medium">{job.jobName}</td><td className="py-2 pr-3">{job.jobName === "epcc-profit" ? "08:05" : "08:15"}</td><td className={`py-2 pr-3 ${job.status === "failed" || job.status === "overdue" ? "text-destructive" : job.status === "successful" ? "text-emerald-400" : "text-muted-foreground"}`}>{job.status}</td><td className="py-2 pr-3">{formatDate(job.latest?.started_at ?? null)}</td><td className="py-2 pr-3">{formatDate(job.latestSuccessful?.completed_at ?? null)}</td><td className="max-w-[300px] whitespace-normal py-2">{job.latest?.error_message ?? (job.status === "overdue" ? "No successful run after today’s scheduled time" : "—")}</td><td className={`py-2 ${job.dataMayBeStale ? "text-destructive" : "text-muted-foreground"}`}>{job.dataMayBeStale ? "Sales Dashboard data may be out of date." : "Current"}</td></tr>)}</tbody></table></div>
  </section>;
}
