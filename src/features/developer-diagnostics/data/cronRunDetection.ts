import type { CronJobName, CronRunHistoryRow } from "../../sales-dashboard/server/cronRunHistory.ts";

export const CRON_SCHEDULES_UTC: Record<CronJobName, { hour: number; minute: number }> = {
  "epcc-profit": { hour: 8, minute: 5 },
  "monday-sales-sync": { hour: 8, minute: 15 },
};
export const CRON_MISSED_RUN_GRACE_MINUTES = 30;

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
