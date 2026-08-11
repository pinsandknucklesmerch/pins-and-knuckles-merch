import "server-only";

import { NextResponse } from "next/server";
import { isEpccCronRequestAuthorised } from "@/features/sales-dashboard/server/epccCronAuth";
import { runEpccProfitIngestion } from "@/features/sales-dashboard/server/epccProfitImporter";
import { completeCronRun, currentCronReportingPeriod, failCronRun, startCronRun } from "@/features/sales-dashboard/server/cronRunHistory";

const EPCC_ORGANISATION_ID = "5df4d50f-959e-4438-a026-df75d54fbbc2";

export async function GET(request: Request) {
  if (!isEpccCronRequestAuthorised(request)) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  const startedAt = new Date();
  let run: Awaited<ReturnType<typeof startCronRun>> | null = null;
  try {
    run = await startCronRun({ organisationId: EPCC_ORGANISATION_ID, jobName: "epcc-profit", reportingPeriod: currentCronReportingPeriod(startedAt) });
  } catch (observabilityError) {
    console.error("Could not start EPCC cron run history", observabilityError);
  }
  try {
    const result = await runEpccProfitIngestion({ apply: true });
    if (run) {
      try {
        await completeCronRun({ id: run.id, startedAt: run.startedAt, reportingPeriod: result.report.reportPeriod, summary: `EPCC ${result.outcome}; monthly profit ${result.report.monthlyProfit}`, metadata: { outcome: result.outcome, memberOutcome: result.memberOutcome } });
      } catch (observabilityError) { console.error("Could not complete EPCC cron run history", observabilityError); }
    }
    return NextResponse.json({ outcome: result.outcome, messageId: result.report.messageId, period: result.report.reportPeriod, monthlyProfit: result.report.monthlyProfit });
 } catch (error) {
  console.error("EPCC Gmail profit cron failed", error);
  if (run) {
    try { await failCronRun({ id: run.id, startedAt: run.startedAt, error }); }
    catch (observabilityError) { console.error("Could not fail EPCC cron run history", observabilityError); }
  }

  return NextResponse.json(
    {
      error: "EPCC profit ingestion failed",
      reason: error instanceof Error ? error.message : "Unknown error",
    },
    { status: 500 },
  );
}
}
