import { isEpccCronRequestAuthorised } from "./epccCronAuth.ts";
import { runMondaySalesCron, type MondayCronResult } from "./mondaySalesCron.ts";
import { completeCronRun, currentCronReportingPeriod, failCronRun, startCronRun } from "./cronRunHistory.ts";

const MONDAY_ORGANISATION_ID = "5df4d50f-959e-4438-a026-df75d54fbbc2";

export function createMondaySalesSyncCronHandler(run = runMondaySalesCron, authorised = isEpccCronRequestAuthorised) {
  return async function GET(request: Request) {
    if (!authorised(request)) return Response.json({ error: "Unauthorised" }, { status: 401 });
    const startedAt = new Date();
    let historyRun: Awaited<ReturnType<typeof startCronRun>> | null = null;
    try {
      historyRun = await startCronRun({ organisationId: MONDAY_ORGANISATION_ID, jobName: "monday-sales-sync", reportingPeriod: currentCronReportingPeriod(startedAt) });
    } catch (observabilityError) { console.error("Could not start Monday cron run history", observabilityError); }
    try {
      const result: MondayCronResult = await run();
      if (historyRun) {
        try { await completeCronRun({ id: historyRun.id, startedAt: historyRun.startedAt, reportingPeriod: { year: result.year, month: result.month }, summary: `Monday ${result.outcome}; quotes ${result.quotesDone ?? "n/a"}; orders ${result.ordersProcessed ?? "n/a"}`, metadata: { outcome: result.outcome, changed: result.changed } }); }
        catch (observabilityError) { console.error("Could not complete Monday cron run history", observabilityError); }
      }
      return Response.json({ outcome: result.outcome, year: result.year, month: result.month, quotesDone: result.quotesDone, ordersProcessed: result.ordersProcessed, changed: result.changed, ...(result.reason ? { reason: result.reason } : {}) });
    } catch (error) {
      console.error("Monday sales sync cron failed");
      if (historyRun) {
        try { await failCronRun({ id: historyRun.id, startedAt: historyRun.startedAt, error }); }
        catch (observabilityError) { console.error("Could not fail Monday cron run history", observabilityError); }
      }
      return Response.json({ error: "Monday sales sync failed" }, { status: 500 });
    }
  };
}
