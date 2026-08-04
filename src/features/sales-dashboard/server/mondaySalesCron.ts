import { randomUUID } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import { MondayClient } from "../../../../scripts/lib/monday/salesHistoryAudit.ts";
import { mondayMemberWritePayload, mondaySalesWritePayload, syncMondaySalesDashboard, type MondayMemberSnapshot, type MondaySnapshot } from "../../../../scripts/lib/monday/salesDashboardSync.ts";

export const MONDAY_SYNC_ORGANISATION_ID = "5df4d50f-959e-4438-a026-df75d54fbbc2";

export type ReportingPeriod = { year: number; month: number };
export type MondayCronResult = { outcome: "updated" | "inserted" | "unchanged" | "already-running" | "rejected"; year: number; month: number; quotesDone: number | null; ordersProcessed: number | null; changed: boolean; reason?: string };

export function currentMondayReportingPeriod(now = new Date()): ReportingPeriod {
  return { year: now.getUTCFullYear(), month: now.getUTCMonth() + 1 };
}

type ExistingMonth = { quotes_done: number | null; orders_processed: number | null; sales_inbox_enquiries?: number | null; converted?: number | null } | null;
export type MondayCronStore = {
  acquireLock(period: ReportingPeriod, token: string): Promise<boolean>;
  releaseLock(period: ReportingPeriod, token: string): Promise<void>;
  readMonth(period: ReportingPeriod): Promise<ExistingMonth>;
  write(snapshot: MondaySnapshot, exists: boolean): Promise<void>;
  writeMembers(snapshots: MondayMemberSnapshot[]): Promise<void>;
};

function serviceDatabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for Monday cron sync.");
  return createClient<Database>(url, key, { auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false } });
}

export function createMondayCronStore(database: SupabaseClient<Database> = serviceDatabase()): MondayCronStore {
  return {
    async acquireLock(period, token) {
      const { data, error } = await database.rpc("try_acquire_monday_sales_sync_lock" as never, { p_organisation_id: MONDAY_SYNC_ORGANISATION_ID, p_year: period.year, p_month: period.month, p_lock_token: token } as never);
      if (error) throw new Error(`Could not acquire Monday sync lock: ${error.message}`);
      return data === true;
    },
    async releaseLock(period, token) {
      const { error } = await database.rpc("release_monday_sales_sync_lock" as never, { p_organisation_id: MONDAY_SYNC_ORGANISATION_ID, p_year: period.year, p_month: period.month, p_lock_token: token } as never);
      if (error) throw new Error(`Could not release Monday sync lock: ${error.message}`);
    },
    async readMonth(period) {
      const { data, error } = await database.from("sales_kpi_months").select("quotes_done,orders_processed,sales_inbox_enquiries,converted").eq("organisation_id", MONDAY_SYNC_ORGANISATION_ID).eq("year", period.year).eq("month", period.month).maybeSingle();
      if (error) throw new Error(`Could not read current Monday KPI snapshot: ${error.message}`);
      return data;
    },
    async write(snapshot, exists) {
      const payload = mondaySalesWritePayload(snapshot);
      const query = exists
        ? database.from("sales_kpi_months").update(payload as never).eq("organisation_id", MONDAY_SYNC_ORGANISATION_ID).eq("year", snapshot.year).eq("month", snapshot.month)
        : database.from("sales_kpi_months").insert(payload as never);
      const { error } = await query;
      if (error) throw new Error(`Could not write current Monday KPI snapshot: ${error.message}`);
    },
    async writeMembers(snapshots) {
      for (const snapshot of snapshots) {
        const key = { organisation_id: MONDAY_SYNC_ORGANISATION_ID, year: snapshot.year, month: snapshot.month, team_member_key: snapshot.team_member_key };
        const { error: insertError } = await database.from("sales_kpi_member_months").upsert({
          ...key,
          team_member_name: snapshot.team_member_name,
          member_classification: snapshot.member_classification,
          data_source: "monday",
        } as never, { onConflict: "organisation_id,year,month,team_member_key", ignoreDuplicates: true });
        if (insertError) throw new Error(`Could not prepare Monday member KPI row: ${insertError.message}`);
        const { error: updateError } = await database.from("sales_kpi_member_months")
          .update(mondayMemberWritePayload(snapshot) as never)
          .match(key);
        if (updateError) throw new Error(`Could not write Monday member KPI row: ${updateError.message}`);
      }
    },
  };
}

export async function runMondaySalesCron(
  dependencies: { now?: Date; store?: MondayCronStore; monday?: Pick<MondayClient, "listAllBoards" | "inspectBoard" | "collectItems"> } = {},
): Promise<MondayCronResult> {
  const now = dependencies.now ?? new Date();
  const period = currentMondayReportingPeriod(now);
  const token = randomUUID();
  const store = dependencies.store ?? createMondayCronStore();
  if (!await store.acquireLock(period, token)) return { outcome: "already-running", year: period.year, month: period.month, quotesDone: null, ordersProcessed: null, changed: false };
  try {
    const monday = dependencies.monday ?? new MondayClient(process.env.MONDAY_API_TOKEN ?? "");
    const existing = await store.readMonth(period);
    const outcomes = await syncMondaySalesDashboard({ year: period.year, months: [period.month], organisationId: MONDAY_SYNC_ORGANISATION_ID, boards: await monday.listAllBoards(), inspectBoard: (boardId) => monday.inspectBoard(boardId), collectItems: (boardId) => monday.collectItems(boardId), existingMonths: new Set(existing ? [period.month] : []), now, force: false, apply: true, trigger: "cron", write: (snapshot, exists) => store.write(snapshot, exists), writeMembers: (snapshots) => store.writeMembers(snapshots) });
    const outcome = outcomes[0];
    const snapshot = outcome.snapshot;
    if (!snapshot || (outcome.status !== "updated" && outcome.status !== "inserted")) {
      return { outcome: "rejected", year: period.year, month: period.month, quotesDone: snapshot?.quotes_done ?? null, ordersProcessed: snapshot?.orders_processed ?? null, changed: false, reason: outcome.reason ?? "Monday sync did not produce a writable snapshot." };
    }
    const changed = !existing || existing.quotes_done !== snapshot.quotes_done || existing.orders_processed !== snapshot.orders_processed || existing.sales_inbox_enquiries !== snapshot.sales_inbox_enquiries || existing.converted !== snapshot.converted;
    return { outcome: changed ? outcome.status : "unchanged", year: period.year, month: period.month, quotesDone: snapshot.quotes_done, ordersProcessed: snapshot.orders_processed, changed };
  } finally {
    await store.releaseLock(period, token);
  }
}
