import { CRON_JOB_NAMES, type CronJobName, type CronRunHistoryRow } from "../server/cronRunHistory.ts";

export const CRON_SCHEDULES_UTC: Record<CronJobName, { hour: number; minute: number }> = {
  "epcc-profit": { hour: 8, minute: 5 },
  "monday-sales-sync": { hour: 8, minute: 15 },
};
export const CRON_MISSED_RUN_GRACE_MINUTES = 30;
export type CronDiagnosticStatus = "successful" | "failed" | "overdue" | "never run";

export function latestCronRuns(rows: CronRunHistoryRow[], jobName: CronJobName) {
  const jobRows = rows.filter((row) => row.job_name === jobName).sort((a, b) => Date.parse(b.started_at) - Date.parse(a.started_at));
  return { latest: jobRows[0] ?? null, latestSuccessful: jobRows.find((row) => row.status === "success") ?? null };
}

export function isCronOverdue(jobName: CronJobName, now = new Date(), latestSuccessful: CronRunHistoryRow | null = null) {
  const schedule = CRON_SCHEDULES_UTC[jobName];
  const scheduled = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), schedule.hour, schedule.minute));
  const graceEnds = new Date(scheduled.getTime() + CRON_MISSED_RUN_GRACE_MINUTES * 60_000);
  if (now < graceEnds) return false;
  if (!latestSuccessful?.completed_at) return true;
  return Date.parse(latestSuccessful.completed_at) < scheduled.getTime();
}

export function cronDiagnosticStatus(latest: CronRunHistoryRow | null, overdue: boolean): CronDiagnosticStatus {
  if (!latest) return overdue ? "overdue" : "never run";
  if (latest.status === "failed") return "failed";
  if (overdue) return "overdue";
  return latest.status === "success" ? "successful" : "overdue";
}

export function cronDataMayBeStale(status: CronDiagnosticStatus) {
  return status === "failed" || status === "overdue";
}

export type SalesDashboardStaleWarning = { jobName: CronJobName; message: string };

function isEpccAuthoritativePeriod(year: number, month: number) {
  return year > 2026 || (year === 2026 && month >= 7);
}

export function buildSalesDashboardStaleWarnings(rows: CronRunHistoryRow[], year: number, month: number, now = new Date()): SalesDashboardStaleWarning[] {
  if (year !== now.getUTCFullYear() || month !== now.getUTCMonth() + 1) return [];
  return CRON_JOB_NAMES.flatMap((jobName) => {
    if (jobName === "epcc-profit" && !isEpccAuthoritativePeriod(year, month)) return [];
    const selected = latestCronRuns(rows, jobName);
    const status = cronDiagnosticStatus(selected.latest, isCronOverdue(jobName, now, selected.latestSuccessful));
    if (!cronDataMayBeStale(status)) return [];
    return [{ jobName, message: jobName === "monday-sales-sync" ? "Sales data may be out of date — Monday sync has not completed successfully today." : "Sales data may be out of date — EPCC Profit sync has not completed successfully today." }];
  });
}
