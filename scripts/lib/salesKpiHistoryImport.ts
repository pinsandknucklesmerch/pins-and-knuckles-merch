import ExcelJS from "exceljs";

export type ConflictPolicy = "insert-only" | "skip-existing" | "update-existing";
export type CompanyRow = { organisation_id: string | null; year: number; month: number; monthly_profit: number | null; quotes_done: number | null; orders_processed: number | null; sales_inbox_enquiries: number | null; converted: number | null; data_source: "historical_fixture"; notes: null };
export type MemberRow = { organisation_id: string | null; year: number; month: number; team_member_key: string; team_member_name: string; quotes_done: number | null; orders_processed: number | null; sales_inbox_enquiries: number | null; converted: number | null; profit: number | null; data_source: "historical_fixture"; notes?: null };
export type AliasConfig = { aliases?: Record<string, string>; knownMembers?: string[]; memberYear?: number };
export type ExistingSnapshot = { company?: CompanyRow[]; members?: MemberRow[] };
export type Issue = { level: "warning" | "error"; code: string; message: string; key?: string };
export type Classification = "insert" | "update-existing" | "skip-existing" | "conflict" | "unknown-existing";
export type ImportReport = { validCompanyRows: CompanyRow[]; validMemberRows: MemberRow[]; warnings: Issue[]; errors: Issue[]; unresolvedMembers: Array<{ name: string; key: string; month: number; year: number }>; duplicates: Issue[]; skippedRows: Issue[]; companyPlan: Record<string, Classification>; memberPlan: Record<string, Classification> };

const months = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
const source = "historical_fixture" as const;

export function parseMonth(value: unknown): number | null {
  const index = months.indexOf(String(value ?? "").trim().toLowerCase());
  return index === -1 ? null : index + 1;
}

export function parseYear(value: unknown): number | null {
  const match = String(value ?? "").match(/(?:19|20)(\d{2})|\b(\d{2})\b/);
  if (!match) return null;
  const year = match[1] ? Number(match[0]) : 2000 + Number(match[2]);
  return year >= 2020 ? year : null;
}

export function parseNumber(value: unknown): number | null {
  if (value === null || value === undefined || String(value).trim() === "") return null;
  const parsed = typeof value === "number" ? value : Number(String(value).replace(/[R,$%\s]/g, "").replace(/,/g, ""));
  return Number.isFinite(parsed) ? parsed : null;
}

export function memberKey(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function resolveMember(name: string, config: AliasConfig) {
  const aliases = new Map(Object.entries(config.aliases ?? {}).map(([from, to]) => [memberKey(from), to]));
  const canonicalName = aliases.get(memberKey(name)) ?? name.trim();
  const known = new Set((config.knownMembers ?? []).map(memberKey));
  return { name: canonicalName, key: memberKey(canonicalName), resolved: known.has(memberKey(canonicalName)) };
}

function text(ws: ExcelJS.Worksheet, cell: string) { return ws.getCell(cell).text; }
function value(ws: ExcelJS.Worksheet, cell: string) { return ws.getCell(cell).value; }
function sheet(workbook: ExcelJS.Workbook, name: string) { const current = workbook.getWorksheet(name); if (!current) throw new Error(`Workbook sheet not found: ${name}`); return current; }

function companyMap(rows: CompanyRow[], year: number, month: number) {
  const key = `${year}-${month}`;
  let row = rows.find((candidate) => `${candidate.year}-${candidate.month}` === key);
  if (!row) { row = { organisation_id: null, year, month, monthly_profit: null, quotes_done: null, orders_processed: null, sales_inbox_enquiries: null, converted: null, data_source: source, notes: null }; rows.push(row); }
  return row;
}

export async function readWorkbook(file: string, config: AliasConfig): Promise<{ company: CompanyRow[]; members: MemberRow[]; warnings: Issue[]; unresolvedMembers: ImportReport["unresolvedMembers"]; skippedRows: Issue[] }> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(file);
  const company: CompanyRow[] = [];
  const members: MemberRow[] = [];
  const warnings: Issue[] = [{ level: "warning", code: "DERIVED_RATES_IGNORED", message: "Conversion percentage cells are formula-derived or presentation values and are not imported." }];
  const unresolvedMembers: ImportReport["unresolvedMembers"] = [];
  const skippedRows: Issue[] = [];

  const profit = sheet(workbook, "Profit");
  for (let column = 3; column <= 7; column += 1) {
    const year = parseYear(text(profit, `${String.fromCharCode(64 + column)}2`));
    if (!year) continue;
    for (let row = 3; row <= 14; row += 1) {
      const month = parseMonth(text(profit, `B${row}`)); const amount = parseNumber(value(profit, `${String.fromCharCode(64 + column)}${row}`));
      if (month && amount !== null) companyMap(company, year, month).monthly_profit = amount;
    }
  }
  const enquiries = sheet(workbook, "Enquiries");
  for (let column = 2; column <= 5; column += 1) {
    const year = parseYear(text(enquiries, `${String.fromCharCode(64 + column)}3`)); if (!year) continue;
    for (let row = 4; row <= 15; row += 1) { const month = parseMonth(text(enquiries, `A${row}`)); const number = parseNumber(value(enquiries, `${String.fromCharCode(64 + column)}${row}`)); if (month && number !== null) companyMap(company, year, month).quotes_done = number; }
  }
  const inbox = sheet(workbook, "SALES INBOX");
  for (const [year, enquiryColumn, conversionColumn] of [[2022, "B", "C"], [2023, "E", "F"], [2024, "H", "I"], [2025, "K", "L"]] as const) {
    for (let row = 4; row <= 15; row += 1) { const month = parseMonth(text(inbox, `A${row}`)); if (!month) continue; const enquiry = parseNumber(value(inbox, `${enquiryColumn}${row}`)); const converted = parseNumber(value(inbox, `${conversionColumn}${row}`)); if (enquiry === null && converted === null) continue; const target = companyMap(company, year, month); if (enquiry !== null) target.sales_inbox_enquiries = enquiry; if (converted !== null) target.converted = converted; }
  }
  const sheetMonths: Array<[string, number]> = [["JAN per sales rep", 1], ["FEB per sales rep", 2], ["MARCH per sales rep", 3], ["APRIL per sales rep", 4], ["MAY per sales rep", 5], ["JUNE per sales rep", 6], ["JULY per sales rep ", 7], ["AUG per sales rep", 8], ["SEPT per sales rep", 9], ["OCT per sales rep", 10], ["NOV per sales rep", 11], ["DEC per sales rep", 12]];
  const memberYear = config.memberYear ?? 2024;
  warnings.push({ level: "warning", code: "MEMBER_YEAR_CONFIGURED", message: `Salesperson sheets have no year header; using configured memberYear ${memberYear}.` });
  for (const [name, month] of sheetMonths) {
    const ws = sheet(workbook, name);
    for (let row = 4; row <= ws.rowCount; row += 1) {
      const rawName = text(ws, `D${row}`).trim(); if (!rawName || rawName.toLowerCase().startsWith("total")) continue;
      const resolved = resolveMember(rawName, config);
      const record: MemberRow = { organisation_id: null, year: memberYear, month, team_member_key: resolved.key, team_member_name: resolved.name, quotes_done: null, orders_processed: null, sales_inbox_enquiries: parseNumber(value(ws, `E${row}`)), converted: parseNumber(value(ws, `G${row}`)), profit: parseNumber(value(ws, `I${row}`)), data_source: source };
      members.push(record);
      if (!resolved.resolved) unresolvedMembers.push({ name: rawName, key: resolved.key, month, year: memberYear });
    }
  }
  for (const year of [2021, 2022, 2023, 2024, 2025]) for (let month = 1; month <= 12; month += 1) {
    if (!company.some((row) => row.year === year && row.month === month)) skippedRows.push({ level: "warning", code: "SKIPPED_EMPTY_PERIOD", key: `${year}:${month}`, message: `Skipped ${year}-${month}: every canonical source cell is blank.` });
  }
  return { company, members, warnings, unresolvedMembers, skippedRows };
}

function companyKey(row: Pick<CompanyRow, "organisation_id" | "year" | "month">) { return `${row.organisation_id ?? "global"}:${row.year}:${row.month}`; }
function memberRowKey(row: MemberRow) { return `${companyKey(row)}:${row.team_member_key}`; }
function same(a: unknown, b: unknown) { return JSON.stringify(a) === JSON.stringify(b); }

function dedupe<T>(rows: T[], keyFor: (row: T) => string, issues: Issue[], label: string) {
  const unique: T[] = []; const seen = new Map<string, T>();
  for (const row of rows) { const key = keyFor(row); const current = seen.get(key); if (!current) { seen.set(key, row); unique.push(row); } else issues.push({ level: "error", code: same(current, row) ? "DUPLICATE_ROW" : "CONFLICTING_DUPLICATE", key, message: `${label} duplicate for ${key}.` }); }
  return unique;
}

function validateRows(rows: Array<CompanyRow | MemberRow>, issues: Issue[]) {
  for (const row of rows) {
    const key = "team_member_key" in row ? memberRowKey(row) : companyKey(row);
    if (!Number.isInteger(row.year) || row.year < 2020) issues.push({ level: "error", code: "INVALID_YEAR", key, message: `Invalid year for ${key}.` });
    if (!Number.isInteger(row.month) || row.month < 1 || row.month > 12) issues.push({ level: "error", code: "INVALID_MONTH", key, message: `Invalid month for ${key}.` });
    for (const [column, value] of Object.entries(row)) if (["monthly_profit", "quotes_done", "orders_processed", "sales_inbox_enquiries", "converted", "profit"].includes(column) && value !== null && (!Number.isFinite(value as number) || (value as number) < 0)) issues.push({ level: "error", code: "INVALID_NUMBER", key, message: `${column} must be finite and non-negative for ${key}.` });
    if ("team_member_key" in row && (!row.team_member_key || !row.team_member_name)) issues.push({ level: "error", code: "MISSING_MEMBER", key, message: `Member name/key is required for ${key}.` });
  }
}

function plan<T extends CompanyRow | MemberRow>(rows: T[], existing: T[] | undefined, keyFor: (row: T) => string, policy: ConflictPolicy) {
  const output: Record<string, Classification> = {};
  for (const row of rows) { const key = keyFor(row); const prior = existing?.find((candidate) => keyFor(candidate) === key); if (!existing) output[key] = "unknown-existing"; else if (!prior) output[key] = "insert"; else if (policy === "update-existing" && prior.data_source === source) output[key] = "update-existing"; else if (policy === "skip-existing") output[key] = "skip-existing"; else output[key] = "conflict"; }
  return output;
}

export function validateImport(input: { company: CompanyRow[]; members: MemberRow[]; warnings?: Issue[]; unresolvedMembers?: ImportReport["unresolvedMembers"]; skippedRows?: Issue[]; existing?: ExistingSnapshot; policy?: ConflictPolicy }): ImportReport {
  const errors: Issue[] = []; const duplicates: Issue[] = []; const warnings = [...(input.warnings ?? [])];
  const company = dedupe(input.company, companyKey, duplicates, "Company row"); const members = dedupe(input.members, memberRowKey, duplicates, "Member row"); errors.push(...duplicates); validateRows(company, errors); validateRows(members, errors);
  const unresolvedMembers = input.unresolvedMembers ?? []; for (const unresolved of unresolvedMembers) errors.push({ level: "error", code: "UNRESOLVED_MEMBER", key: `${unresolved.year}:${unresolved.month}:${unresolved.key}`, message: `Unresolved member ${unresolved.name}.` });
  const policy = input.policy ?? "skip-existing"; const companyPlan = plan(company, input.existing?.company, companyKey, policy); const memberPlan = plan(members, input.existing?.members, memberRowKey, policy);
  for (const [key, classification] of Object.entries({ ...companyPlan, ...memberPlan })) if (classification === "conflict") errors.push({ level: "error", code: "EXISTING_ROW_CONFLICT", key, message: `Existing row conflict for ${key}; manual/live data will not be overwritten.` });
  return { validCompanyRows: errors.length ? [] : company, validMemberRows: errors.length ? [] : members, warnings, errors, unresolvedMembers, duplicates, skippedRows: input.skippedRows ?? [], companyPlan, memberPlan };
}

function sql(value: string | number | null) { if (value === null) return "NULL"; return typeof value === "number" ? String(value) : `'${value.replace(/'/g, "''")}'`; }
export function generateSql(company: CompanyRow[], members: MemberRow[], policy: ConflictPolicy) {
  const clause = policy === "update-existing" ? "DO UPDATE SET monthly_profit = EXCLUDED.monthly_profit, quotes_done = EXCLUDED.quotes_done, orders_processed = EXCLUDED.orders_processed, sales_inbox_enquiries = EXCLUDED.sales_inbox_enquiries, converted = EXCLUDED.converted, data_source = EXCLUDED.data_source, notes = EXCLUDED.notes WHERE sales_kpi_months.data_source = 'historical_fixture'" : "DO NOTHING";
  const memberClause = policy === "update-existing" ? "DO UPDATE SET team_member_name = EXCLUDED.team_member_name, quotes_done = EXCLUDED.quotes_done, orders_processed = EXCLUDED.orders_processed, sales_inbox_enquiries = EXCLUDED.sales_inbox_enquiries, converted = EXCLUDED.converted, profit = EXCLUDED.profit, data_source = EXCLUDED.data_source WHERE sales_kpi_member_months.data_source = 'historical_fixture'" : "DO NOTHING";
  const lines = ["-- Generated locally. Review before applying; this file never connects to Supabase.", "BEGIN;"];
  for (const row of company) lines.push(`INSERT INTO public.sales_kpi_months (organisation_id, year, month, monthly_profit, quotes_done, orders_processed, sales_inbox_enquiries, converted, data_source, notes) VALUES (${[row.organisation_id, row.year, row.month, row.monthly_profit, row.quotes_done, row.orders_processed, row.sales_inbox_enquiries, row.converted, row.data_source, row.notes].map(sql).join(", ")}) ON CONFLICT (organisation_id, year, month) ${clause};`);
  for (const row of members) lines.push(`INSERT INTO public.sales_kpi_member_months (organisation_id, year, month, team_member_key, team_member_name, quotes_done, orders_processed, sales_inbox_enquiries, converted, profit, data_source) VALUES (${[row.organisation_id, row.year, row.month, row.team_member_key, row.team_member_name, row.quotes_done, row.orders_processed, row.sales_inbox_enquiries, row.converted, row.profit, row.data_source].map(sql).join(", ")}) ON CONFLICT (organisation_id, year, month, team_member_key) ${memberClause};`);
  lines.push("COMMIT;"); return `${lines.join("\n")}\n`;
}
