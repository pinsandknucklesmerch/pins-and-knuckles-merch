import "server-only";

import { NextResponse } from "next/server";
import { isEpccCronRequestAuthorised } from "@/features/sales-dashboard/server/epccCronAuth";
import { runEpccProfitIngestion } from "@/features/sales-dashboard/server/epccProfitImporter";
import { completeCronRun, currentCronReportingPeriod, failCronRun, runWithCronHistory, startCronRun } from "@/features/sales-dashboard/server/cronRunHistory";

const EPCC_ORGANISATION_ID = "5df4d50f-959e-4438-a026-df75d54fbbc2";

export async function GET(request: Request) {
  if (!isEpccCronRequestAuthorised(request)) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  const startedAt = new Date();
  try {
    const result = await runWithCronHistory({
      jobName: "epcc-profit",
      start: () => startCronRun({ organisationId: EPCC_ORGANISATION_ID, jobName: "epcc-profit", reportingPeriod: currentCronReportingPeriod(startedAt) }),
      run: () => runEpccProfitIngestion({ apply: true }),
      complete: (run, completed) => completeCronRun({ id: run.id, startedAt: run.startedAt, reportingPeriod: completed.report.reportPeriod, summary: `EPCC ${completed.outcome}; monthly profit ${completed.report.monthlyProfit}`, metadata: { outcome: completed.outcome, memberOutcome: completed.memberOutcome } }),
      fail: (run, error) => failCronRun({ id: run.id, startedAt: run.startedAt, error }),
    });
    return NextResponse.json({ outcome: result.outcome, messageId: result.report.messageId, period: result.report.reportPeriod, monthlyProfit: result.report.monthlyProfit });
  } catch (error) {
  console.error("EPCC Gmail profit cron failed", error);
  return NextResponse.json(
    {
      error: "EPCC profit ingestion failed",
      reason: error instanceof Error ? error.message : "Unknown error",
    },
    { status: 500 },
  );
}
}
