import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";
import { EPCC_PROFIT_ORGANISATION_ID, parseEpccProfitEmail, type EpccProfitEmailReport } from "../lib/epccProfitEmail.ts";
import { createGmailProfitClient, type GmailProfitClient } from "./gmailProfitClient.ts";
import { isRecognisedEpccMember, mapEpccMember, type MemberClassification } from "../domain/memberIdentity.ts";

export type EpccIngestionOptions = { apply: boolean; messageId?: string; year?: number; month?: number };
export type EpccMemberSnapshot = {
  team_member_key: string;
  team_member_name: string;
  member_classification: MemberClassification;
  profit: number;
  pk_tax: number;
  epcc_source_metadata: {
    gmailMessageId: string;
    receivedAt: string;
    reportStart: string;
    reportEnd: string;
    sourceHash: string;
    sourceDisplayedNames: string[];
    sourceRowCount: number;
    reportGrandTotals: { profit: number; pkTax: number };
    reconciliationDifferences: { profit: number; pkTax: number };
  };
};
export type EpccMemberReconciliation = { ok: boolean; differences: { profit: number; pkTax: number }; calculatedTotals: { profit: number; pkTax: number } };
export type EpccIngestionResult = { mode: "dry-run" | "apply"; outcome: "dry-run" | "applied" | "duplicate" | "older"; report: EpccProfitEmailReport; memberSnapshots: EpccMemberSnapshot[]; memberReconciliation: EpccMemberReconciliation; memberOutcome: "dry-run" | "applied" | "skipped" | "rejected" };

export type EpccProfitStore = { ingest(report: EpccProfitEmailReport, memberSnapshots: EpccMemberSnapshot[]): Promise<"applied" | "duplicate" | "older"> };

export const EPCC_CURRENCY_TOLERANCE = 0.01;

/** This patch deliberately excludes every Monday-owned member field. */
export function epccMemberWritePayload(snapshot: EpccMemberSnapshot) {
  return {
    profit: snapshot.profit,
    pk_tax: snapshot.pk_tax,
    epcc_source_metadata: snapshot.epcc_source_metadata,
  };
}

function roundCurrency(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function reconcileEpccMemberTotals(report: EpccProfitEmailReport): EpccMemberReconciliation {
  const calculatedTotals = {
    profit: roundCurrency(report.memberSubtotals.reduce((total, row) => total + row.profit, 0)),
    pkTax: roundCurrency(report.memberSubtotals.reduce((total, row) => total + row.pkTax, 0)),
  };
  const differences = {
    profit: roundCurrency(calculatedTotals.profit - report.monthlyProfit),
    pkTax: roundCurrency(calculatedTotals.pkTax - report.totalPkTax),
  };
  return { calculatedTotals, differences, ok: Math.abs(differences.profit) <= EPCC_CURRENCY_TOLERANCE && Math.abs(differences.pkTax) <= EPCC_CURRENCY_TOLERANCE };
}

export function buildEpccMemberSnapshots(report: EpccProfitEmailReport, reconciliation = reconcileEpccMemberTotals(report)): EpccMemberSnapshot[] {
  const members = new Map<string, EpccMemberSnapshot & { sourceNames: Set<string> }>();
  for (const subtotal of report.memberSubtotals) {
    const member = mapEpccMember(subtotal.sourceName);
    const current = members.get(member.key) ?? {
      team_member_key: member.key, team_member_name: member.displayName, member_classification: member.classification,
      profit: 0, pk_tax: 0,
      epcc_source_metadata: {
        gmailMessageId: report.messageId, receivedAt: report.receivedAt, reportStart: report.reportStart, reportEnd: report.reportEnd,
        sourceHash: report.sourceHash, sourceDisplayedNames: [], sourceRowCount: 0,
        reportGrandTotals: { profit: report.monthlyProfit, pkTax: report.totalPkTax }, reconciliationDifferences: reconciliation.differences,
      }, sourceNames: new Set<string>(),
    };
    current.profit = roundCurrency(current.profit + subtotal.profit);
    current.pk_tax = roundCurrency(current.pk_tax + subtotal.pkTax);
    current.epcc_source_metadata.sourceRowCount += subtotal.sourceRowCount;
    if (subtotal.sourceName) current.sourceNames.add(subtotal.sourceName);
    if (!isRecognisedEpccMember(subtotal.sourceName) && !subtotal.sourceName) current.sourceNames.add("(blank salesperson)");
    members.set(member.key, current);
  }
  return [...members.values()].map(({ sourceNames, ...member }) => ({ ...member, epcc_source_metadata: { ...member.epcc_source_metadata, sourceDisplayedNames: [...sourceNames].sort((a, b) => a.localeCompare(b)) } })).sort((a, b) => a.team_member_key.localeCompare(b.team_member_key));
}

function serviceDatabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for --apply.");
  return createClient<Database>(url, key, { auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false } });
}

export function createEpccProfitStore(database: SupabaseClient<Database> = serviceDatabase()): EpccProfitStore {
  return {
    async ingest(report, memberSnapshots) {
      const { data, error } = await database.rpc("ingest_epcc_monthly_profit_and_members", {
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
        p_member_rows: memberSnapshots,
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
  const memberReconciliation = reconcileEpccMemberTotals(report);
  const memberSnapshots = buildEpccMemberSnapshots(report, memberReconciliation);
  if (!options.apply) return { mode: "dry-run", outcome: "dry-run", report, memberSnapshots, memberReconciliation, memberOutcome: memberReconciliation.ok ? "dry-run" : "rejected" };
  const outcome = await (dependencies.store ?? createEpccProfitStore()).ingest(report, memberReconciliation.ok ? memberSnapshots : []);
  return { mode: "apply", outcome, report, memberSnapshots, memberReconciliation, memberOutcome: !memberReconciliation.ok ? "rejected" : outcome === "applied" ? "applied" : "skipped" };
}
