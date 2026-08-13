import { createClient } from "@/lib/supabase/server";
import { CRON_JOB_NAMES, type CronJobName, type CronRunHistoryRow } from "@/features/sales-dashboard/server/cronRunHistory";
import { cronDataMayBeStale, cronDiagnosticStatus, isCronOverdue, latestCronRuns, type CronDiagnosticStatus } from "./cronRunDetection";

export type CronDiagnostic = { jobName: CronJobName; latest: CronRunHistoryRow | null; latestSuccessful: CronRunHistoryRow | null; overdue: boolean; status: CronDiagnosticStatus; dataMayBeStale: boolean };

export async function loadCronDiagnostics(organisationId: string, now = new Date()): Promise<{ jobs: CronDiagnostic[]; error: string | null }> {
  const { data, error } = await (await createClient()).from("cron_run_history").select("*").eq("organisation_id", organisationId).in("job_name", [...CRON_JOB_NAMES]).order("started_at", { ascending: false }).limit(200);
  if (error) return { jobs: CRON_JOB_NAMES.map((jobName) => ({ jobName, latest: null, latestSuccessful: null, overdue: false, status: "never run" as const, dataMayBeStale: false })), error: "Cron history is unavailable." };
  const rows = (data ?? []) as unknown as CronRunHistoryRow[];
  return { jobs: CRON_JOB_NAMES.map((jobName) => { const selected = latestCronRuns(rows, jobName); const overdue = isCronOverdue(jobName, now, selected.latestSuccessful); const status = cronDiagnosticStatus(selected.latest, overdue); return { jobName, ...selected, overdue, status, dataMayBeStale: cronDataMayBeStale(status) }; }), error: null };
}
