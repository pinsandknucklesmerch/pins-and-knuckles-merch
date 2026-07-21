import { mkdir, readFile, writeFile } from "node:fs/promises";
import { basename, resolve } from "node:path";
import { generateSql, readWorkbook, validateImport, type AliasConfig, type ConflictPolicy, type ExistingSnapshot } from "./lib/salesKpiHistoryImport.ts";

type Options = { command: "preview" | "validate" | "generate"; organisationId: string | null; output: string; aliases: string; existing?: string; policy: ConflictPolicy };
function option(args: string[], name: string) { const index = args.indexOf(name); return index === -1 ? undefined : args[index + 1]; }
function parseArgs(args: string[]): Options {
  const command = args[0] as Options["command"]; if (!(["preview", "validate", "generate"] as string[]).includes(command)) throw new Error("Use preview, validate, or generate.");
  const organisation = option(args, "--organisation-id");
  if (!organisation) throw new Error("--organisation-id is required; use global explicitly for fixture-compatible rows.");
  if (organisation !== "global" && !/^[0-9a-f]{8}-(?:[0-9a-f]{4}-){3}[0-9a-f]{12}$/i.test(organisation)) throw new Error("--organisation-id must be a UUID or global.");
  const policy = (option(args, "--conflict-policy") ?? "skip-existing") as ConflictPolicy; if (!(["insert-only", "skip-existing", "update-existing"] as string[]).includes(policy)) throw new Error("Unsupported conflict policy.");
  return { command, organisationId: organisation === "global" ? null : organisation, output: option(args, "--output") ?? "docs/imports/sales-kpi-history/generated", aliases: option(args, "--aliases") ?? "docs/imports/sales-kpi-history/member-aliases.json", existing: option(args, "--existing"), policy };
}
function setOrganisation<T extends { organisation_id: string | null }>(rows: T[], organisationId: string | null) { return rows.map((row) => ({ ...row, organisation_id: organisationId })); }

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const aliases = JSON.parse(await readFile(resolve(options.aliases), "utf8")) as AliasConfig;
  const existing = options.existing ? JSON.parse(await readFile(resolve(options.existing), "utf8")) as ExistingSnapshot : undefined;
  const workbook = await readWorkbook("docs/Monthly Compare.xlsx", aliases);
  const company = setOrganisation(workbook.company, options.organisationId); const members = setOrganisation(workbook.members, options.organisationId);
  const report = validateImport({ company, members, warnings: workbook.warnings, unresolvedMembers: workbook.unresolvedMembers, skippedRows: workbook.skippedRows, existing, policy: options.policy });
  const summary = { source: basename("docs/Monthly Compare.xlsx"), organisation_id: options.organisationId, policy: options.policy, totals: { companyRows: company.length, memberRows: members.length, validCompanyRows: report.validCompanyRows.length, validMemberRows: report.validMemberRows.length, warnings: report.warnings.length, blockingErrors: report.errors.length, unresolvedMembers: report.unresolvedMembers.length, duplicateRows: report.duplicates.length, skippedRows: report.skippedRows.length }, report };
  if (options.command === "preview") { console.log(JSON.stringify(summary, null, 2)); return; }
  if (options.command === "validate") { console.log(JSON.stringify(summary, null, 2)); if (report.errors.length) process.exitCode = 1; return; }
  await mkdir(resolve(options.output), { recursive: true });
  await Promise.all([writeFile(resolve(options.output, "company-rows.json"), JSON.stringify(company, null, 2) + "\n"), writeFile(resolve(options.output, "member-rows.json"), JSON.stringify(members, null, 2) + "\n"), writeFile(resolve(options.output, "validation-report.json"), JSON.stringify(summary, null, 2) + "\n"), writeFile(resolve(options.output, "unresolved-members.json"), JSON.stringify(report.unresolvedMembers, null, 2) + "\n"), writeFile(resolve(options.output, "duplicate-conflict-report.json"), JSON.stringify({ duplicates: report.duplicates, errors: report.errors.filter((issue) => issue.code.includes("CONFLICT")) }, null, 2) + "\n")]);
  if (report.errors.length) { await writeFile(resolve(options.output, "proposed-import.sql"), "-- SQL not generated: resolve validation errors first.\n"); console.error(JSON.stringify(summary, null, 2)); process.exitCode = 1; return; }
  await writeFile(resolve(options.output, "proposed-import.sql"), generateSql(company, members, options.policy)); console.log(JSON.stringify(summary, null, 2));
}
main().catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
