import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { CRON_JOB_NAMES, type CronRunHistoryRow } from "../server/cronRunHistory";
import { buildSalesDashboardStaleWarnings, type SalesDashboardStaleWarning } from "../lib/cronRunStatus";

export type { SalesDashboardStaleWarning } from "../lib/cronRunStatus";

export async function loadSalesDashboardStaleWarnings(organisationId: string | null, year: number, month: number, now = new Date()): Promise<SalesDashboardStaleWarning[]> {
  if (!organisationId) return [];
  try {
    const { data, error } = await createAdminClient().from("cron_run_history").select("*").eq("organisation_id", organisationId).in("job_name", [...CRON_JOB_NAMES]).order("started_at", { ascending: false }).limit(200);
    if (error) {
      console.error("Could not load Sales Dashboard cron status", error);
      return [];
    }
    return buildSalesDashboardStaleWarnings((data ?? []) as unknown as CronRunHistoryRow[], year, month, now);
  } catch (error) {
    console.error("Could not load Sales Dashboard cron status", error);
    return [];
  }
}
