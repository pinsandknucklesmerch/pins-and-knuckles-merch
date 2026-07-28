import { isEpccCronRequestAuthorised } from "./epccCronAuth.ts";
import { runMondaySalesCron, type MondayCronResult } from "./mondaySalesCron.ts";

export function createMondaySalesSyncCronHandler(run = runMondaySalesCron, authorised = isEpccCronRequestAuthorised) {
  return async function GET(request: Request) {
    if (!authorised(request)) return Response.json({ error: "Unauthorised" }, { status: 401 });
    try {
      const result: MondayCronResult = await run();
      return Response.json({ outcome: result.outcome, year: result.year, month: result.month, quotesDone: result.quotesDone, ordersProcessed: result.ordersProcessed, changed: result.changed });
    } catch {
      console.error("Monday sales sync cron failed");
      return Response.json({ error: "Monday sales sync failed" }, { status: 500 });
    }
  };
}
