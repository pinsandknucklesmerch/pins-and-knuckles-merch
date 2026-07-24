import { createHash } from "node:crypto";

export const EPCC_PROFIT_SUBJECT = "Pins Knuckles Profits V2 ALL SALES";
export const EPCC_PROFIT_SENDER = "system@sent-via.netsuite.com";
export const EPCC_PROFIT_ORGANISATION_ID = "5df4d50f-959e-4438-a026-df75d54fbbc2";

export type EpccProfitEmailReport = {
  messageId: string;
  subject: string;
  sender: string;
  receivedAt: string;
  reportStart: string;
  reportEnd: string;
  reportPeriod: { year: number; month: number };
  totalSales: number;
  monthlyProfit: number;
  totalPkTax: number;
  sourceHash: string;
};

const MONTHS = new Map([
  ["january", 1], ["february", 2], ["march", 3], ["april", 4], ["may", 5], ["june", 6],
  ["july", 7], ["august", 8], ["september", 9], ["october", 10], ["november", 11], ["december", 12],
]);

function decodeQuotedPrintable(value: string) {
  const unfolded = value.replace(/=\r?\n/g, "");
  return Buffer.from(unfolded.replace(/=([0-9A-F]{2})/gi, (_match, hex: string) => String.fromCharCode(Number.parseInt(hex, 16))), "latin1").toString("utf8");
}

function decodeHtml(value: string) {
  return value
    .replace(/<br\s*\/?\s*>/gi, "\n")
    .replace(/<\/tr\s*>/gi, "\n")
    .replace(/<\/p\s*>/gi, "\n")
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&pound;|&#163;/gi, "£")
    .replace(/&amp;/gi, "&")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/gi, '"')
    .replace(/[ \t]+/g, " ")
    .replace(/ *\n */g, "\n")
    .trim();
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

function mimeText(headers: Map<string, string>, body: string): string {
  const contentType = header(headers, "content-type");
  const boundary = contentType.match(/boundary=(?:"([^"]+)"|([^;\s]+))/i)?.slice(1).find(Boolean);
  if (/^multipart\//i.test(contentType) && boundary) {
    return body.split(`--${boundary}`).map((part) => {
      if (!part.trim() || part.trim() === "--") return "";
      try {
        const parsed = headersFrom(part.replace(/^\r?\n/, ""));
        return mimeText(parsed.headers, parsed.body);
      } catch {
        return "";
      }
    }).filter(Boolean).join("\n");
  }
  if (contentType && !/^text\/(?:plain|html)/i.test(contentType)) return "";
  const transferEncoding = header(headers, "content-transfer-encoding").toLowerCase();
  if (transferEncoding === "base64") return Buffer.from(body.replace(/\s/g, ""), "base64").toString("utf8");
  return transferEncoding === "quoted-printable" ? decodeQuotedPrintable(body) : body;
}

function header(headers: Map<string, string>, name: string) {
  return headers.get(name.toLowerCase()) ?? "";
}

function address(value: string) {
  return (value.match(/<([^>]+)>/)?.[1] ?? value).trim().toLowerCase();
}

function isoDate(day: string, monthName: string, year: string) {
  const month = MONTHS.get(monthName.toLowerCase());
  if (!month) throw new Error(`Unknown report month: ${monthName}.`);
  const date = new Date(Date.UTC(Number(year), month - 1, Number(day)));
  if (date.getUTCDate() !== Number(day) || date.getUTCMonth() !== month - 1 || date.getUTCFullYear() !== Number(year)) throw new Error("Report date range is invalid.");
  return { iso: `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`, year: Number(year), month };
}

function parseCurrency(value: string) {
  if (!/^-?\d{1,3}(?:,\d{3})*(?:\.\d{2})$|^-?\d+(?:\.\d{2})$/.test(value)) throw new Error(`Malformed currency value: ${value}.`);
  const parsed = Number(value.replaceAll(",", ""));
  if (!Number.isFinite(parsed)) throw new Error(`Malformed currency value: ${value}.`);
  return parsed;
}

function finalTotal(text: string) {
  const lines = text.split(/\r?\n/).map((line) => line.replace(/\s+/g, " ").trim());
  const candidates = lines.filter((line) => /^Total\s+£/.test(line));
  if (candidates.length === 0) throw new Error("Final overall Total row is missing.");
  const row = candidates.at(-1)!;
  const match = row.match(/^Total\s+£(-?[\d,]+\.\d{2})\s+£?(-?[\d,]+\.\d{2})\s+£?(-?[\d,]+\.\d{2})$/);
  if (!match) throw new Error(`Final overall Total row is malformed: ${row}.`);
  return { totalSales: parseCurrency(match[1]), monthlyProfit: parseCurrency(match[2]), totalPkTax: parseCurrency(match[3]) };
}

export function isEpccAuthoritativePeriod(year: number, month: number) {
  return year > 2026 || (year === 2026 && month >= 7);
}

export function parseEpccProfitEmail(eml: string, receivedAtOverride?: string, messageIdOverride?: string): EpccProfitEmailReport {
  const { headers, body } = headersFrom(eml);
  const subject = header(headers, "subject");
  if (subject !== EPCC_PROFIT_SUBJECT) throw new Error(`Unexpected subject: ${subject || "(missing)"}.`);
  const sender = address(header(headers, "from"));
  if (sender !== EPCC_PROFIT_SENDER) throw new Error(`Unexpected sender: ${sender || "(missing)"}.`);
  const messageId = messageIdOverride ?? header(headers, "message-id").replace(/^<|>$/g, "");
  if (!messageId) throw new Error("Gmail message ID is missing.");
  const text = decodeHtml(mimeText(headers, body));
  const period = text.match(/\b(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})\s*-\s*(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})\b/);
  if (!period) throw new Error("Report date range is missing.");
  const start = isoDate(period[1], period[2], period[3]);
  const end = isoDate(period[4], period[5], period[6]);
  if (start.year !== end.year || start.month !== end.month) throw new Error("EPCC report must cover one calendar month.");
  if (!isEpccAuthoritativePeriod(start.year, start.month)) throw new Error("EPCC profit reports before July 2026 are not authoritative.");
  const received = receivedAtOverride ?? header(headers, "date");
  const receivedAt = new Date(received);
  if (Number.isNaN(receivedAt.valueOf())) throw new Error("Email received date is invalid.");
  return {
    messageId, subject, sender, receivedAt: receivedAt.toISOString(), reportStart: start.iso, reportEnd: end.iso,
    reportPeriod: { year: start.year, month: start.month }, ...finalTotal(text),
    sourceHash: createHash("sha256").update(eml).digest("hex"),
  };
}
