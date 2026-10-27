import { isEpccCronRequestAuthorised } from "./epccCronAuth.ts";
import { runMondaySalesCron, type MondayCronResult } from "./mondaySalesCron.ts";
import { cronRunHistory, currentCronReportingPeriod, runWithCronHistory, type CronHistoryClient } from "./cronRunHistory.ts";

const MONDAY_ORGANISATION_ID = "5df4d50f-959e-4438-a026-df75d54fbbc2";

export function createMondaySalesSyncCronHandler(run = runMondaySalesCron, authorised = isEpccCronRequestAuthorised, history: CronHistoryClient = cronRunHistory) {
  return async function GET(request: Request) {
    if (!authorised(request)) return Response.json({ error: "Unauthorised" }, { status: 401 });
    const startedAt = new Date();
    try {
      const result: MondayCronResult = await runWithCronHistory({
        jobName: "monday-sales-sync",
        start: () => history.start({ organisationId: MONDAY_ORGANISATION_ID, jobName: "monday-sales-sync", reportingPeriod: currentCronReportingPeriod(startedAt) }),
        run,
        complete: (historyRun, completed) => {
          if (completed.outcome === "rejected" || completed.outcome === "already-running") {
            return history.fail({
              id: historyRun.id,
              startedAt: historyRun.startedAt,
              error: new Error(completed.reason ?? (completed.outcome === "already-running" ? "Monday sales sync is already running." : "Monday sales sync rejected the source data.")),
              metadata: { outcome: completed.outcome, changed: completed.changed },
            });
          }
          return history.complete({ id: historyRun.id, startedAt: historyRun.startedAt, reportingPeriod: { year: completed.year, month: completed.month }, summary: `Monday ${completed.outcome}; quotes ${completed.quotesDone ?? "n/a"}; orders ${completed.ordersProcessed ?? "n/a"}`, metadata: { outcome: completed.outcome, changed: completed.changed } });
        },
        fail: (historyRun, error) => history.fail({ id: historyRun.id, startedAt: historyRun.startedAt, error }),
      });
      const status = result.outcome === "rejected" ? 422 : result.outcome === "already-running" ? 409 : 200;
      return Response.json({ outcome: result.outcome, year: result.year, month: result.month, quotesDone: result.quotesDone, ordersProcessed: result.ordersProcessed, changed: result.changed, ...(result.reason ? { reason: result.reason } : {}) }, { status });
    } catch {
      console.error("Monday sales sync cron failed");
      return Response.json({ error: "Monday sales sync failed" }, { status: 500 });
    }
  };
}
