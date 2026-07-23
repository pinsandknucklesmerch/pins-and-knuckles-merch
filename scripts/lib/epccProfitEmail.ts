import { createHash } from "node:crypto";

export const EPCC_PROFIT_SUBJECT = "Pins Knuckles Profits V2 ALL SALES";
const REQUIRED_COLUMNS = ["Sales Rep", "Transaction Type", "Name", "Date", "Num", "Item", "Quantity", "Customer:Job", "Description", "Design 1", "Total", "Profit Total", "Profit %", "Total PK Tax"] as const;

export type EpccProfitTransaction = {
  salesRep: string;
  transactionType: string;
  name: string;
  date: string;
  num: string;
  item: string;
  quantity: number;
  customerJob: string;
  description: string;
  design: string;
  total: number;
  profitTotal: number | null;
  profitPercent: number | null;
  totalPkTax: number | null;
};

export type EpccProfitEmailReport = {
  messageId: string;
  subject: string;
  sender: string;
  receivedAt: string;
  reportPeriod: { year: number; month: number };
  parsedRowCount: number;
  monthlyProfit: number;
  sourceHash: string;
  transactions: EpccProfitTransaction[];
  numericErrors: Array<{ row: number; column: string; value: string }>;
  aggregationRule: string;
};

type HtmlCell = { attributes: string; text: string };

function decodeQuotedPrintable(value: string) {
  const unfolded = value.replace(/=\r?\n/g, "");
  const bytes = unfolded.replace(/=([0-9A-F]{2})/gi, (_match, hex: string) => String.fromCharCode(Number.parseInt(hex, 16)));
  return Buffer.from(bytes, "latin1").toString("utf8");
}

function decodeHtml(value: string) {
  return value.replace(/<[^>]*>/g, " ").replace(/&nbsp;/gi, " ").replace(/&amp;/gi, "&").replace(/&quot;/gi, '"').replace(/&#39;/g, "'").replace(/&#(\d+);/g, (_match, code: string) => String.fromCodePoint(Number(code))).replace(/\s+/g, " ").trim();
}

function headersFrom(eml: string) {
  const separator = eml.search(/\r?\n\r?\n/);
  if (separator === -1) throw new Error("Email headers are missing.");
  const rawHeaders = eml.slice(0, separator).replace(/\r?\n[ \t]+/g, " ");
  const headers = new Map<string, string>();
  for (const line of rawHeaders.split(/\r?\n/)) {
    const delimiter = line.indexOf(":");
    if (delimiter > 0) headers.set(line.slice(0, delimiter).toLowerCase(), line.slice(delimiter + 1).trim());
  }
  return { headers, body: eml.slice(separator).replace(/^\r?\n\r?\n/, "") };
}

function header(headers: Map<string, string>, name: string) {
  return headers.get(name.toLowerCase()) ?? "";
}

function parseNumber(value: string) {
  const normalised = value.replace(/[£$€,\s]/g, "").replace(/,/g, "");
  if (!normalised) return null;
  const number = Number(normalised);
  return Number.isFinite(number) ? number : null;
}

function parseDate(value: string) {
  const match = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) return null;
  const [, day, month, year] = match;
  const parsed = new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
  return parsed.getUTCFullYear() === Number(year) && parsed.getUTCMonth() === Number(month) - 1 && parsed.getUTCDate() === Number(day)
    ? { year: Number(year), month: Number(month) }
    : null;
}

function attribute(cell: HtmlCell, name: string) {
  return cell.attributes.match(new RegExp(`\\b${name}=["']([^"']*)["']`, "i"))?.[1] ?? "";
}

function profitTable(html: string) {
  const tables = html.match(/<table\b[\s\S]*?<\/table>/gi) ?? [];
  const table = tables.find((candidate) => /Sales Rep<\/td>/i.test(candidate) && /Transaction Type/i.test(candidate));
  if (!table) throw new Error("NetSuite profit report table is missing.");
  return table;
}

function tableRows(table: string) {
  return (table.match(/<tr\b[\s\S]*?<\/tr>/gi) ?? []).map((row) => Array.from(row.matchAll(/<td\b([^>]*)>([\s\S]*?)<\/td>/gi), (match) => ({ attributes: match[1], text: decodeHtml(match[2]) })));
}

function reportColumns(rows: HtmlCell[][]) {
  const headerRow = rows.find((cells) => cells.some((cell) => cell.text === "Profit Total"));
  if (!headerRow) throw new Error("NetSuite profit report columns are missing.");
  const columns = headerRow.map((cell) => cell.text === "Transaction Type: Transaction Type Long Name" ? "Transaction Type" : cell.text);
  const missing = REQUIRED_COLUMNS.filter((column) => !columns.includes(column));
  if (missing.length) throw new Error(`NetSuite profit report is missing required columns: ${missing.join(", ")}.`);
  return columns;
}

function readNumeric(cell: HtmlCell, row: number, column: string, errors: EpccProfitEmailReport["numericErrors"], required: boolean) {
  const raw = attribute(cell, "rawvalue") || cell.text;
  if (!raw) return null;
  const value = parseNumber(raw);
  if (value === null && required) errors.push({ row, column, value: raw });
  return value;
}

export function parseEpccProfitEmail(eml: string): EpccProfitEmailReport {
  const { headers, body } = headersFrom(eml);
  const subject = header(headers, "subject");
  if (subject !== EPCC_PROFIT_SUBJECT) throw new Error(`Unexpected subject: ${subject || "(missing)"}.`);
  const sender = header(headers, "from");
  if (!sender || !/(netsuite|sent-via\.netsuite\.com)/i.test(`${sender} ${header(headers, "x-netsuite")}`)) throw new Error("Email is not a NetSuite / EPCC source.");
  const html = decodeQuotedPrintable(body);
  const title = html.match(/<title>([\s\S]*?)<\/title>/i)?.[1] ? decodeHtml(html.match(/<title>([\s\S]*?)<\/title>/i)![1]) : "";
  if (title !== EPCC_PROFIT_SUBJECT) throw new Error(`Unexpected report title: ${title || "(missing)"}.`);
  const rows = tableRows(profitTable(html));
  const columns = reportColumns(rows);
  const index = new Map(columns.map((column, position) => [column, position]));
  const value = (cells: HtmlCell[], column: string) => {
    const cell = cells[index.get(column)!];
    if (!cell) throw new Error(`NetSuite profit report row is missing ${column}.`);
    return cell;
  };
  const numericErrors: EpccProfitEmailReport["numericErrors"] = [];
  const transactions: EpccProfitTransaction[] = [];
  const months = new Set<string>();

  rows.forEach((cells, rowIndex) => {
    const transactionType = value(cells, "Transaction Type")?.text;
    const date = value(cells, "Date")?.text;
    if (!transactionType || !date || cells.length !== REQUIRED_COLUMNS.length) return;
    const period = parseDate(date);
    if (!period) return;
    const row = rowIndex + 1;
    const quantity = readNumeric(value(cells, "Quantity"), row, "Quantity", numericErrors, true);
    const total = readNumeric(value(cells, "Total"), row, "Total", numericErrors, true);
    const profitTotal = readNumeric(value(cells, "Profit Total"), row, "Profit Total", numericErrors, true);
    const profitPercent = readNumeric(value(cells, "Profit %"), row, "Profit %", numericErrors, false);
    const totalPkTax = readNumeric(value(cells, "Total PK Tax"), row, "Total PK Tax", numericErrors, false);
    if (quantity === null || total === null) return;
    months.add(`${period.year}-${period.month}`);
    transactions.push({ salesRep: value(cells, "Sales Rep").text, transactionType, name: value(cells, "Name").text, date, num: value(cells, "Num").text, item: value(cells, "Item").text, quantity, customerJob: value(cells, "Customer:Job").text, description: value(cells, "Description").text, design: value(cells, "Design 1").text, total, profitTotal, profitPercent, totalPkTax });
  });

  if (numericErrors.length) throw new Error(`NetSuite profit report has numeric parsing errors: ${numericErrors.map((error) => `${error.column} row ${error.row} (${error.value})`).join(", ")}.`);
  if (!transactions.length) throw new Error("NetSuite profit report has no valid transaction rows.");
  if (months.size !== 1) throw new Error(`NetSuite profit report must contain exactly one report month; found ${months.size}.`);
  const [periodKey] = months;
  const [year, month] = periodKey.split("-").map(Number);
  const receivedHeader = header(headers, "received");
  const receivedDate = receivedHeader.includes(";") ? receivedHeader.slice(receivedHeader.lastIndexOf(";") + 1).trim() : header(headers, "date");
  const receivedAt = new Date(receivedDate);
  if (Number.isNaN(receivedAt.valueOf())) throw new Error("Email received date is invalid.");
  return {
    messageId: header(headers, "message-id"), subject, sender, receivedAt: receivedAt.toISOString(), reportPeriod: { year, month }, parsedRowCount: transactions.length,
    monthlyProfit: Number(transactions.reduce((sum, transaction) => sum + (transaction.profitTotal ?? 0), 0).toFixed(2)),
    sourceHash: createHash("sha256").update(eml).digest("hex"), transactions, numericErrors,
    aggregationRule: "Sum Profit Total across every item-level transaction row. Sales-rep summary rows are excluded; repeated Num values are retained because they are separate invoice item lines. Blank Profit Total values are retained as report rows and contribute 0.00.",
  };
}
