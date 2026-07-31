import { createClient } from "@supabase/supabase-js";
import { pathToFileURL } from "node:url";
import { MondayClient } from "./lib/monday/salesHistoryAudit.ts";
import { mondayMemberWritePayload, mondaySalesWritePayload, syncMondaySalesDashboard, type MondayMemberSnapshot, type MondaySnapshot } from "./lib/monday/salesDashboardSync.ts";

function option(args: string[], name: string) { const index = args.indexOf(name); return index === -1 ? undefined : args[index + 1]; }
function optionCount(args: string[], name: string) { return args.filter((arg) => arg === name).length; }
function requiredSingleOption(args: string[], name: string) {
  if (optionCount(args, name) !== 1 || option(args, name)?.startsWith("--")) throw new Error(`${name} must be provided exactly once.`);
  return option(args, name)!;
}
function formatSupabaseError(error: { message?: string | null; code?: string | null; details?: string | null; hint?: string | null }) {
  return JSON.stringify({ message: error.message ?? null, code: error.code ?? null, details: error.details ?? null, hint: error.hint ?? null });
}
export function parseArgs(args: string[]) {
  const supported = new Set(["--year", "--month", "--organisation-id", "--reviewed-year", "--reviewed-month", "--apply", "--force"]);
  for (const arg of args) if (arg.startsWith("--") && !supported.has(arg)) throw new Error(`Unsupported option ${arg}; ranges and multi-month apply are not supported.`);
  const year = Number(requiredSingleOption(args, "--year")); const monthValue = option(args, "--month"); const month = monthValue ? Number(monthValue) : undefined;
  if (optionCount(args, "--month") > 1) throw new Error("--month must be provided at most once; range and multi-month apply are not supported.");
  if (!Number.isInteger(year) || year < 2020) throw new Error("--year must be a four-digit year.");
  if (month !== undefined && (!Number.isInteger(month) || month < 1 || month > 12)) throw new Error("--month must be between 1 and 12.");
  const apply = args.includes("--apply");
  if (apply && month === undefined) throw new Error("--apply requires --month; year-only mode is preview-only.");
  if (apply && year !== 2025 && year !== 2026) throw new Error("Historical apply is restricted to --year 2025 or a bounded reviewed 2026 month.");
  if (apply && !args.includes("--force")) throw new Error("Historical apply requires --force after reviewing the dry-run audit.");
  const reviewedYearValue = option(args, "--reviewed-year"); const reviewedMonthValue = option(args, "--reviewed-month");
  if (optionCount(args, "--reviewed-year") > 1 || optionCount(args, "--reviewed-month") > 1) throw new Error("Reviewed scope options must be provided at most once.");
  if (apply && year === 2026) {
    const reviewedYear = Number(requiredSingleOption(args, "--reviewed-year"));
    const reviewedMonth = Number(requiredSingleOption(args, "--reviewed-month"));
    if (reviewedYear !== year || reviewedMonth !== month) throw new Error("2026 apply target must exactly match the reviewed dry-run scope.");
  } else if (reviewedYearValue !== undefined || reviewedMonthValue !== undefined) {
    throw new Error("--reviewed-year and --reviewed-month are only valid for bounded 2026 apply.");
  }
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
    write: async (snapshot: MondaySnapshot, exists: boolean) => {
      const payload = mondaySalesWritePayload(snapshot);
      const query = exists
        ? database.from("sales_kpi_months").update(payload as never).eq("year", snapshot.year).eq("month", snapshot.month)
        : database.from("sales_kpi_months").insert(payload as never);
      const { error } = options.organisationId === null
        ? await query.is("organisation_id", null)
        : await query.eq("organisation_id", options.organisationId);
      if (error) throw error;
    },
    writeMembers: async (snapshots: MondayMemberSnapshot[]) => {
      for (const snapshot of snapshots) {
        const key = { organisation_id: options.organisationId, year: snapshot.year, month: snapshot.month, team_member_key: snapshot.team_member_key };
        const { error: insertError } = await database.from("sales_kpi_member_months").upsert({
          ...key, team_member_name: snapshot.team_member_name, member_classification: snapshot.member_classification, data_source: "monday",
        } as never, { onConflict: "organisation_id,year,month,team_member_key", ignoreDuplicates: true });
        if (insertError) throw insertError;
        const memberUpdate = database.from("sales_kpi_member_months").update(mondayMemberWritePayload(snapshot) as never).eq("year", snapshot.year).eq("month", snapshot.month).eq("team_member_key", snapshot.team_member_key);
        const { error: updateError } = options.organisationId === null
          ? await memberUpdate.is("organisation_id", null)
          : await memberUpdate.eq("organisation_id", options.organisationId);
        if (updateError) throw updateError;
      }
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
