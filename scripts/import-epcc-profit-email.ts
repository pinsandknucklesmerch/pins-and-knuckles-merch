import { readFile } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";
import { pathToFileURL } from "node:url";
import { parseEpccProfitEmail } from "./lib/epccProfitEmail.ts";
import type { Database } from "../src/types/database.types.ts";

type Options = { input: string; organisationId: string | null; apply: boolean };

function option(args: string[], name: string) { const index = args.indexOf(name); return index === -1 ? undefined : args[index + 1]; }

export function parseEpccProfitImportArgs(args: string[]): Options {
  const organisation = option(args, "--organisation-id");
  const input = option(args, "--input");
  if (!organisation) throw new Error("--organisation-id is required; use global explicitly for the global organisation.");
  if (organisation !== "global" && !/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(organisation)) throw new Error("--organisation-id must be a UUID or global.");
  if (!input) throw new Error("--input must point to a local .eml file.");
  return { input, organisationId: organisation === "global" ? null : organisation, apply: args.includes("--apply") };
}

export async function runEpccProfitEmailImport(args = process.argv.slice(2)) {
  const options = parseEpccProfitImportArgs(args);
  const report = parseEpccProfitEmail(await readFile(options.input, "utf8"));
  const summary = { mode: options.apply ? "apply" : "dry-run", organisationId: options.organisationId, source: { messageId: report.messageId, subject: report.subject, sender: report.sender, receivedAt: report.receivedAt, reportPeriod: report.reportPeriod, parsedRowCount: report.parsedRowCount, sourceHash: report.sourceHash }, monthlyProfit: report.monthlyProfit, aggregationRule: report.aggregationRule, numericErrors: report.numericErrors };
  if (!options.apply) { console.log(JSON.stringify(summary, null, 2)); return summary; }
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for --apply.");
  const database = createClient<Database>(url, key, { auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false } });
  const { data, error } = await database.rpc("ingest_epcc_monthly_profit", {
    p_organisation_id: options.organisationId, p_year: report.reportPeriod.year, p_month: report.reportPeriod.month, p_monthly_profit: report.monthlyProfit,
    p_source_hash: report.sourceHash, p_message_id: report.messageId, p_subject: report.subject, p_sender: report.sender, p_received_at: report.receivedAt,
    p_parsed_row_count: report.parsedRowCount, p_aggregation_rule: report.aggregationRule,
  });
  if (error) throw new Error(`Could not apply EPCC profit report: ${error.message}`);
  console.log(JSON.stringify({ ...summary, applied: data }, null, 2));
  return { ...summary, applied: data };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runEpccProfitEmailImport().catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
}
