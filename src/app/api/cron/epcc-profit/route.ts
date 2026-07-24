import "server-only";

import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { runEpccProfitIngestion } from "@/features/sales-dashboard/server/epccProfitImporter";

// export const dynamic = "force-dynamic";

function authorised(request: Request) {
  const secret = process.env.CRON_SECRET;
  const provided = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  if (!secret || provided.length !== secret.length) return false;
  return timingSafeEqual(Buffer.from(provided), Buffer.from(secret));
}

export async function GET(request: Request) {
  if (!authorised(request)) return NextResponse.json({ error: "Unauthorised" }, { status: 401 });
  try {
    const result = await runEpccProfitIngestion({ apply: true });
    return NextResponse.json({ outcome: result.outcome, messageId: result.report.messageId, period: result.report.reportPeriod, monthlyProfit: result.report.monthlyProfit });
  } catch (error) {
    console.error("EPCC Gmail profit cron failed", error);
    return NextResponse.json({ error: "EPCC profit ingestion failed" }, { status: 500 });
  }
}
