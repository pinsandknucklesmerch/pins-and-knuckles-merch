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
        complete: (historyRun, completed) => history.complete({ id: historyRun.id, startedAt: historyRun.startedAt, reportingPeriod: { year: completed.year, month: completed.month }, summary: `Monday ${completed.outcome}; quotes ${completed.quotesDone ?? "n/a"}; orders ${completed.ordersProcessed ?? "n/a"}`, metadata: { outcome: completed.outcome, changed: completed.changed } }),
        fail: (historyRun, error) => history.fail({ id: historyRun.id, startedAt: historyRun.startedAt, error }),
      });
      return Response.json({ outcome: result.outcome, year: result.year, month: result.month, quotesDone: result.quotesDone, ordersProcessed: result.ordersProcessed, changed: result.changed, ...(result.reason ? { reason: result.reason } : {}) });
    } catch {
      console.error("Monday sales sync cron failed");
      return Response.json({ error: "Monday sales sync failed" }, { status: 500 });
    }
  };
}
