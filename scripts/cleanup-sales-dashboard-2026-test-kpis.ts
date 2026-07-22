import { createClient } from "@supabase/supabase-js";
import { pathToFileURL } from "node:url";
import type { Database } from "../src/types/database.types.ts";
import {
  CLEANUP_MONTHS,
  CLEANUP_ORGANISATION_ID,
  CLEANUP_UPDATE,
  CLEANUP_YEAR,
  planMondayKpiCleanup,
  type MondayKpiCleanupRow,
} from "./lib/salesDashboard2026Cleanup.ts";

const SELECT_COLUMNS = "organisation_id,year,month,monthly_profit,quotes_done,orders_processed,monday_scope_a_leads,monday_scope_a_converted,monday_scope_a_conversion_rate,sales_inbox_enquiries,converted,monday_sync_metadata,data_source";

function parseArgs(args: string[]) {
  if (args.some((arg) => arg !== "--apply")) throw new Error("Only --apply is supported. Run without arguments for a dry run.");
  return { apply: args.includes("--apply") };
}

export async function runSalesDashboard2026Cleanup(args = process.argv.slice(2)) {
  const { apply } = parseArgs(args);
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_URL are required in the server environment.");

  const database = createClient<Database>(url, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false } });
  const { data, error } = await database.from("sales_kpi_months").select(SELECT_COLUMNS)
    .eq("organisation_id", CLEANUP_ORGANISATION_ID).eq("year", CLEANUP_YEAR).in("month", CLEANUP_MONTHS).eq("data_source", "monday");
  if (error) throw new Error("Could not read the scoped Sales Dashboard KPI rows.");

  const plan = planMondayKpiCleanup((data ?? []) as MondayKpiCleanupRow[]);
  const report = {
    mode: apply ? "apply" : "dry-run",
    target: { organisationId: CLEANUP_ORGANISATION_ID, year: CLEANUP_YEAR, months: CLEANUP_MONTHS, dataSource: "monday" },
    ...plan,
  };
  if (!apply) {
    console.log(JSON.stringify(report, null, 2));
    return report;
  }

  const { data: updated, error: updateError } = await database.from("sales_kpi_months").update(CLEANUP_UPDATE)
    .eq("organisation_id", CLEANUP_ORGANISATION_ID).eq("year", CLEANUP_YEAR).in("month", CLEANUP_MONTHS).eq("data_source", "monday").select("month");
  if (updateError) throw new Error("Could not clear the scoped Sales Dashboard test KPI fields.");
  const result = { ...report, updatedMonths: (updated ?? []).map((row) => row.month).sort((a, b) => a - b) };
  console.log(JSON.stringify(result, null, 2));
  return result;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runSalesDashboard2026Cleanup().catch((error) => {
    console.error(error instanceof Error ? error.message : "Sales Dashboard cleanup failed.");
    process.exitCode = 1;
  });
}
