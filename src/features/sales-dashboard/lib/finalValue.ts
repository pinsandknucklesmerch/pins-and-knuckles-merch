import type { FinalisableSalesKpiCode } from "../domain/types.ts";

const FINAL_CODES = ["MONTHLY_PROFIT", "PK_TAX", "QUOTES_DONE", "ORDERS_PROCESSED"] as const satisfies readonly FinalisableSalesKpiCode[];

export function validateSalesKpiMonthFinalValue(metricCode: string, raw: string): { metricCode: FinalisableSalesKpiCode; value: number } | null {
  const code = metricCode as FinalisableSalesKpiCode;
  const isCount = code === "QUOTES_DONE" || code === "ORDERS_PROCESSED";
  const input = raw.trim();
  if (!FINAL_CODES.includes(code) || !input) return null;

  const normalized = isCount
    ? input
    : input.replace(/^[£$€]\s*/, "").replace(/,/g, "");
  const numericPattern = isCount
    ? /^\d+(?:\.\d+)?$/
    : /^(?:\d+|\d{1,3}(?:,\d{3})+)(?:\.\d+)?$/;
  if (!numericPattern.test(isCount ? input : input.replace(/^[£$€]\s*/, ""))) return null;

  const value = Number(normalized);
  if (!Number.isFinite(value) || value < 0 || (isCount && !Number.isInteger(value))) return null;
  return { metricCode: code, value };
}
