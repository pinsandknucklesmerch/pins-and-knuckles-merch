import type { CronDiagnostic } from "../data/cronRuns";

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-ZA", { dateStyle: "short", timeStyle: "short", timeZone: "UTC" }).format(new Date(value));
}

export function CronDiagnostics({ jobs, error }: { jobs: CronDiagnostic[]; error: string | null }) {
  return <section aria-labelledby="cron-diagnostics-heading" className="mt-5 border-y border-border py-3">
    <div className="mb-2 flex items-center justify-between gap-3"><h2 id="cron-diagnostics-heading" className="text-sm font-semibold">Cron / Scheduled Jobs</h2>{error ? <span className="text-xs text-destructive">{error}</span> : null}</div>
    <div className="overflow-x-auto"><table className="w-full min-w-[680px] text-left text-xs"><thead className="text-muted-foreground"><tr><th className="pb-2 pr-3 font-medium">Job</th><th className="pb-2 pr-3 font-medium">Last run</th><th className="pb-2 pr-3 font-medium">Status</th><th className="pb-2 pr-3 font-medium">Reporting month</th><th className="pb-2 pr-3 font-medium">Duration</th><th className="pb-2 font-medium">Failure</th></tr></thead><tbody>{jobs.map((job) => <tr key={job.jobName} className="border-t border-border/60 align-top"><td className="py-2 pr-3 font-medium">{job.jobName}</td><td className="py-2 pr-3">{formatDate(job.latest?.started_at ?? null)}</td><td className={`py-2 pr-3 ${job.latest?.status === "failed" || job.overdue ? "text-destructive" : job.latest?.status === "success" ? "text-emerald-400" : "text-muted-foreground"}`}>{job.overdue ? "overdue" : job.latest?.status ?? "no runs"}</td><td className="py-2 pr-3">{job.latest ? `${job.latest.reporting_year}-${String(job.latest.reporting_month).padStart(2, "0")}` : "—"}</td><td className="py-2 pr-3">{job.latest?.duration_ms == null ? "—" : `${job.latest.duration_ms} ms`}</td><td className="max-w-[280px] whitespace-normal py-2">{job.latest?.status === "failed" ? job.latest.error_message ?? "Unknown failure" : job.overdue ? "No successful run after today’s scheduled time" : "—"}</td></tr>)}</tbody></table></div>
  </section>;
}
