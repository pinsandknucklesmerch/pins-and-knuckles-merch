import type { FinalisableSalesKpiCode } from "../domain/types.ts";

const FINAL_CODES = ["MONTHLY_PROFIT", "PK_TAX", "QUOTES_DONE", "ORDERS_PROCESSED"] as const satisfies readonly FinalisableSalesKpiCode[];

export function validateSalesKpiMonthFinalValue(metricCode: string, raw: string): { metricCode: FinalisableSalesKpiCode; value: number } | null {
  const code = metricCode as FinalisableSalesKpiCode;
  const value = Number(raw.trim());
  if (!FINAL_CODES.includes(code) || !raw.trim() || !Number.isFinite(value) || value < 0 || ((code === "QUOTES_DONE" || code === "ORDERS_PROCESSED") && !Number.isInteger(value))) return null;
  return { metricCode: code, value };
}
