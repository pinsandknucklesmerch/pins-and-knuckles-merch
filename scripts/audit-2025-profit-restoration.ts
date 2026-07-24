import { readFile } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";

type FixtureRow = { organisation_id: string | null; year: number; month: number; monthly_profit: number | null };
type DatabaseRow = { month: number; monthly_profit: number | null; monthly_profit_source: string | null };

function option(args: string[], name: string) { const index = args.indexOf(name); return index === -1 ? undefined : args[index + 1]; }
function organisation(args: string[]) {
  const value = option(args, "--organisation-id") ?? "global";
  if (value !== "global" && !/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(value)) throw new Error("--organisation-id must be a UUID or global.");
  return value === "global" ? null : value;
}

export async function audit2025ProfitRestoration(args = process.argv.slice(2)) {
  const apply = args.includes("--apply");
  const organisationId = organisation(args);
  const fixture = JSON.parse(await readFile("docs/imports/sales-kpi-history/generated/company-rows.json", "utf8")) as FixtureRow[];
  const candidates = fixture.filter((row) => row.organisation_id === null && row.year === 2025 && row.monthly_profit !== null).map((row) => ({ month: row.month, profit: row.monthly_profit! }));
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_URL are required in the server environment.");
  const database = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false } });
  const query = database.from("sales_kpi_months").select("month,monthly_profit,monthly_profit_source").eq("year", 2025);
  const { data, error } = organisationId === null ? await query.is("organisation_id", null) : await query.eq("organisation_id", organisationId);
  if (error) throw new Error(`Could not read 2025 Sales Dashboard profits: ${error.message}`);
  const current = new Map((data ?? []).map((row) => [row.month, row as DatabaseRow]));
  const plan = candidates.map((candidate) => {
    const row = current.get(candidate.month);
    if (!row) return { ...candidate, status: "missing-db-row", source: "historical-fixture-workbook", action: "not-safe-to-insert" };
    if (row.monthly_profit !== null) return { ...candidate, currentProfit: row.monthly_profit, currentSource: row.monthly_profit_source, status: "already-present", source: "historical-fixture-workbook", action: "none" };
    return { ...candidate, currentProfit: null, currentSource: row.monthly_profit_source, status: "recoverable", source: "historical-fixture-workbook", action: "restore-profit-only" };
  });
  if (apply) {
    for (const item of plan.filter((item) => item.status === "recoverable")) {
      const update = database.from("sales_kpi_months").update({ monthly_profit: item.profit }).eq("year", 2025).eq("month", item.month).is("monthly_profit", null);
      const { error: updateError } = organisationId === null ? await update.is("organisation_id", null) : await update.eq("organisation_id", organisationId);
      if (updateError) throw new Error(`Could not restore 2025-${item.month}: ${updateError.message}`);
    }
  }
  console.log(JSON.stringify({ mode: apply ? "apply" : "dry-run", year: 2025, source: "docs/imports/sales-kpi-history/generated/company-rows.json", sourceGuarantee: "The fixture verifies profit values only; it does not prove monthly_profit_source, which is never changed by this script.", plan }, null, 2));
}

audit2025ProfitRestoration().catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
