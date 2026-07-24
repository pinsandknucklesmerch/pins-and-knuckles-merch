import { pathToFileURL } from "node:url";
import { runEpccProfitIngestion, type EpccIngestionOptions } from "../src/features/sales-dashboard/server/epccProfitImporter.ts";

function option(args: string[], name: string) {
  const index = args.indexOf(name);
  if (index === -1) return undefined;
  const value = args[index + 1];
  if (!value || value.startsWith("--")) throw new Error(`${name} requires a value.`);
  return value;
}

function integerOption(args: string[], name: string) {
  const raw = option(args, name);
  if (raw === undefined) return undefined;
  const value = Number(raw);
  if (!Number.isInteger(value)) throw new Error(`${name} must be an integer.`);
  return value;
}

export function parseEpccProfitImportArgs(args: string[]): EpccIngestionOptions {
  const year = integerOption(args, "--year");
  const month = integerOption(args, "--month");
  if (year !== undefined && year < 2026) throw new Error("--year must be 2026 or later.");
  if (month !== undefined && (month < 1 || month > 12)) throw new Error("--month must be between 1 and 12.");
  return { apply: args.includes("--apply"), messageId: option(args, "--message-id"), year, month };
}

export async function runEpccProfitEmailImport(args = process.argv.slice(2)) {
  const result = await runEpccProfitIngestion(parseEpccProfitImportArgs(args));
  console.log(JSON.stringify(result, null, 2));
  return result;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runEpccProfitEmailImport().catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
}
