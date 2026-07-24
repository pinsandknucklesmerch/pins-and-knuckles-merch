import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import { EPCC_PROFIT_ORGANISATION_ID, parseEpccProfitEmail, type EpccProfitEmailReport } from "../lib/epccProfitEmail";
import { createGmailProfitClient, type GmailProfitClient } from "./gmailProfitClient";

export type EpccIngestionOptions = { apply: boolean; messageId?: string; year?: number; month?: number };
export type EpccIngestionResult = { mode: "dry-run" | "apply"; outcome: "dry-run" | "applied" | "duplicate" | "older"; report: EpccProfitEmailReport };

export type EpccProfitStore = { ingest(report: EpccProfitEmailReport): Promise<"applied" | "duplicate" | "older"> };

function serviceDatabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for --apply.");
  return createClient<Database>(url, key, { auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false } });
}

export function createEpccProfitStore(database: SupabaseClient<Database> = serviceDatabase()): EpccProfitStore {
  return {
    async ingest(report) {
      const { data, error } = await database.rpc("ingest_epcc_monthly_profit", {
        p_organisation_id: EPCC_PROFIT_ORGANISATION_ID,
        p_message_id: report.messageId,
        p_subject: report.subject,
        p_sender: report.sender,
        p_received_at: report.receivedAt,
        p_report_start: report.reportStart,
        p_report_end: report.reportEnd,
        p_year: report.reportPeriod.year,
        p_month: report.reportPeriod.month,
        p_total_sales: report.totalSales,
        p_total_profit: report.monthlyProfit,
        p_total_pk_tax: report.totalPkTax,
        p_source_hash: report.sourceHash,
      });
      if (error) throw new Error(`Could not ingest EPCC profit report: ${error.message}`);
      if (data !== "applied" && data !== "duplicate" && data !== "older") throw new Error(`Unexpected EPCC ingestion result: ${String(data)}.`);
      return data;
    },
  };
}

function matches(report: EpccProfitEmailReport, options: EpccIngestionOptions) {
  return (options.year === undefined || report.reportPeriod.year === options.year)
    && (options.month === undefined || report.reportPeriod.month === options.month);
}

export async function runEpccProfitIngestion(
  options: EpccIngestionOptions,
  dependencies: { gmail?: GmailProfitClient; store?: EpccProfitStore } = {},
): Promise<EpccIngestionResult> {
  const gmail = dependencies.gmail ?? createGmailProfitClient();
  const messages = await gmail.findMessages({ messageId: options.messageId });
  let report: EpccProfitEmailReport | undefined;
  const errors: string[] = [];
  for (const message of messages) {
    try {
      const parsed = parseEpccProfitEmail(message.raw, message.receivedAt, message.id);
      if (matches(parsed, options)) { report = parsed; break; }
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error));
      if (options.messageId) throw error;
    }
  }
  if (!report) throw new Error(`No matching EPCC profit report was found.${errors.length ? ` Latest parse error: ${errors[0]}` : ""}`);
  if (!options.apply) return { mode: "dry-run", outcome: "dry-run", report };
  const outcome = await (dependencies.store ?? createEpccProfitStore()).ingest(report);
  return { mode: "apply", outcome, report };
}
