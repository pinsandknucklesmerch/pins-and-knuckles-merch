import "server-only";

import { NextResponse } from "next/server";
import { isEpccCronRequestAuthorised } from "@/features/sales-dashboard/server/epccCronAuth";
import { runEpccProfitIngestion } from "@/features/sales-dashboard/server/epccProfitImporter";

export async function GET(request: Request) {
  if (!isEpccCronRequestAuthorised(request)) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  try {
    const result = await runEpccProfitIngestion({ apply: true });
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
