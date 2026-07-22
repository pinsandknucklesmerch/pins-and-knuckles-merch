import { normalizeStatus, type MondayBoard, type MondayItem } from "./salesHistoryAudit.ts";

export const MONDAY_PROFIT_CUTOFF = { year: 2026, month: 7 } as const;

export type ProfitTrackingAudit = {
  sourceBoardId: string;
  resolvedProfitColumnId: string | null;
  includedRows: Array<{ id: string; name: string; value: number }>;
  excludedRows: Array<{ id: string; name: string; reason: "blank-profit" | "invalid-profit" }>;
  calculatedMonthlyTotal: number | null;
  fetchedAt: string;
};

export function resolveProfitColumnId(board: MondayBoard) {
  return board.columns?.find((column) => normalizeStatus(column.title) === "profit" && column.type === "numbers")?.id ?? null;
}

export function roundMonthlyProfitTotal(value: number) {
  return Number(value.toFixed(2));
}

function parseProfitValue(raw: string | null | undefined): number | null {
  const value = raw?.trim();
  if (!value) return null;
  try {
    const parsed: unknown = JSON.parse(value);
    if (typeof parsed === "number" && Number.isFinite(parsed)) return parsed;
    if (typeof parsed === "string") return parseProfitValue(parsed);
    if (parsed && typeof parsed === "object" && "number" in parsed) return parseProfitValue(String(parsed.number));
  } catch {}
  const normalised = value.replace(/,/g, "").replace(/[^0-9.-]/g, "");
  if (!normalised || !/^-?(?:\d+(?:\.\d+)?|\.\d+)$/.test(normalised)) return null;
  const numeric = Number(normalised);
  return Number.isFinite(numeric) ? numeric : null;
}

export function auditProfitTracking(board: MondayBoard, items: MondayItem[], fetchedAt: string): ProfitTrackingAudit {
  const resolvedProfitColumnId = resolveProfitColumnId(board);
  const includedRows: ProfitTrackingAudit["includedRows"] = [];
  const excludedRows: ProfitTrackingAudit["excludedRows"] = [];
  if (!resolvedProfitColumnId) return { sourceBoardId: String(board.id), resolvedProfitColumnId, includedRows, excludedRows, calculatedMonthlyTotal: null, fetchedAt };

  for (const item of items) {
    if (normalizeStatus(item.group?.title) !== "profit tracking") continue;
    const column = item.column_values?.find((candidate) => candidate.id === resolvedProfitColumnId);
    const raw = column?.value ?? column?.text;
    const value = parseProfitValue(raw);
    if (value !== null) includedRows.push({ id: String(item.id), name: item.name, value });
    else excludedRows.push({ id: String(item.id), name: item.name, reason: raw?.trim() ? "invalid-profit" : "blank-profit" });
  }
  const total = includedRows.reduce((sum, row) => sum + row.value, 0);
  return { sourceBoardId: String(board.id), resolvedProfitColumnId, includedRows, excludedRows, calculatedMonthlyTotal: roundMonthlyProfitTotal(total), fetchedAt };
}

export function shouldWriteMondayProfit(year: number, month: number, cutoff = MONDAY_PROFIT_CUTOFF) {
  return year < cutoff.year || (year === cutoff.year && month < cutoff.month);
}
