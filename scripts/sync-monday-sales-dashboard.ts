import { createClient } from "@supabase/supabase-js";
import { pathToFileURL } from "node:url";
import { MondayClient } from "./lib/monday/salesHistoryAudit.ts";
import { syncMondaySalesDashboard, type MondaySnapshot } from "./lib/monday/salesDashboardSync.ts";

function option(args: string[], name: string) { const index = args.indexOf(name); return index === -1 ? undefined : args[index + 1]; }
function formatSupabaseError(error: { message?: string | null; code?: string | null; details?: string | null; hint?: string | null }) {
  return JSON.stringify({ message: error.message ?? null, code: error.code ?? null, details: error.details ?? null, hint: error.hint ?? null });
}
function parseArgs(args: string[]) {
  const year = Number(option(args, "--year")); const monthValue = option(args, "--month"); const month = monthValue ? Number(monthValue) : undefined;
  if (!Number.isInteger(year) || year < 2020) throw new Error("--year must be a four-digit year.");
  if (month !== undefined && (!Number.isInteger(month) || month < 1 || month > 12)) throw new Error("--month must be between 1 and 12.");
  const apply = args.includes("--apply");
  if (apply && month === undefined) throw new Error("--apply requires --month; year-only mode is preview-only.");
  const organisation = option(args, "--organisation-id") ?? "global";
  if (organisation !== "global" && !/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(organisation)) throw new Error("--organisation-id must be a UUID or global.");
  return { year, months: month ? [month] : Array.from({ length: 12 }, (_, index) => index + 1), apply, force: args.includes("--force"), organisationId: organisation === "global" ? null : organisation };
}

export async function runMondaySalesDashboardSync(args = process.argv.slice(2)) {
  const options = parseArgs(args);
  const token = process.env.MONDAY_API_TOKEN;
  if (!token) throw new Error("MONDAY_API_TOKEN is required in the server environment.");
  const monday = new MondayClient(token);
  const boards = await monday.listAllBoards();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("SUPABASE_SERVICE_ROLE_KEY and NEXT_PUBLIC_SUPABASE_URL are required in the server environment.");
  const database = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false } });
  const existing = new Set<number>();
  const existingQuery = database.from("sales_kpi_months").select("month").eq("year", options.year);
  const { data, error } = options.organisationId === null
    ? await existingQuery.is("organisation_id", null)
    : await existingQuery.eq("organisation_id", options.organisationId);
  if (error) throw new Error(`Could not read existing Sales Dashboard snapshots: ${formatSupabaseError(error)}`);
  for (const row of data ?? []) existing.add(row.month);
  const outcomes = await syncMondaySalesDashboard({
    ...options, boards, existingMonths: existing, now: new Date(), inspectBoard: (boardId) => monday.inspectBoard(boardId),
    collectItems: (boardId) => monday.collectItems(boardId),
    write: async (snapshot: MondaySnapshot) => {
      const { error } = await database.from("sales_kpi_months").upsert(snapshot as never, { onConflict: "organisation_id,year,month" });
      if (error) throw error;
    },
  });
  const counts = outcomes.reduce<Record<string, number>>((result, outcome) => ({ ...result, [outcome.status]: (result[outcome.status] ?? 0) + 1 }), {});
  console.log(JSON.stringify({ mode: options.apply ? "apply" : "dry-run", year: options.year, outcomes, counts }, null, 2));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runMondaySalesDashboardSync().catch((error) => {
    console.error(error instanceof Error ? error.message : "Monday sales sync failed.");
    process.exitCode = 1;
  });
}
