import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { validateSalesKpiMonthFinalValue } from "../lib/finalValue.ts";
import { calculateCompanyMetrics } from "../domain/calculateDashboardKpis.ts";
import { effectiveCompanyKpiValue, type CompanyKpiMonth, DEFAULT_SALES_KPI_TARGETS } from "../domain/types.ts";

const month = (finalValues: CompanyKpiMonth["finalValues"] = {}): CompanyKpiMonth => ({ year: 2026, month: 7, monthlyProfit: 100, monthlyPkTax: 12.5, quotesDone: 20, ordersProcessed: 10, salesInboxEnquiries: 0, converted: 0, mondaySyncMetadata: null, notes: null, source: "monday", finalValues });

test("calculated values are effective when no final exists", () => {
  assert.equal(effectiveCompanyKpiValue(month(), "MONTHLY_PROFIT"), 100);
  assert.equal(effectiveCompanyKpiValue(month(), "PK_TAX"), 12.5);
});

test("each KPI final is independent and zero is valid", () => {
  const current = month({ MONTHLY_PROFIT: { value: 125, updatedAt: "2026-07-31T00:00:00Z", updatedBy: "user" }, QUOTES_DONE: { value: 0, updatedAt: "2026-07-31T00:00:00Z", updatedBy: "user" } });
  assert.deepEqual([effectiveCompanyKpiValue(current, "MONTHLY_PROFIT"), effectiveCompanyKpiValue(current, "PK_TAX"), effectiveCompanyKpiValue(current, "QUOTES_DONE"), effectiveCompanyKpiValue(current, "ORDERS_PROCESSED")], [125, 12.5, 0, 10]);
  const metrics = calculateCompanyMetrics(current, null, DEFAULT_SALES_KPI_TARGETS);
  assert.equal(metrics.find((metric) => metric.code === "MONTHLY_PROFIT")?.value, 125);
  assert.equal(metrics.find((metric) => metric.code === "QUOTES_DONE")?.value, 0);
});

test("clearing a final returns the KPI to calculated value", () => {
  const current = month({ PK_TAX: { value: 14, updatedAt: "2026-07-31T00:00:00Z", updatedBy: "user" } });
  assert.equal(effectiveCompanyKpiValue(current, "PK_TAX"), 14);
  assert.equal(effectiveCompanyKpiValue({ ...current, finalValues: {} }, "PK_TAX"), 12.5);
});

test("final value validation accepts formatted monetary values", () => {
  assert.deepEqual(validateSalesKpiMonthFinalValue("MONTHLY_PROFIT", "165942.07"), { metricCode: "MONTHLY_PROFIT", value: 165942.07 });
  assert.deepEqual(validateSalesKpiMonthFinalValue("MONTHLY_PROFIT", "165,942.07"), { metricCode: "MONTHLY_PROFIT", value: 165942.07 });
  assert.deepEqual(validateSalesKpiMonthFinalValue("MONTHLY_PROFIT", "£165,942.07"), { metricCode: "MONTHLY_PROFIT", value: 165942.07 });
  assert.deepEqual(validateSalesKpiMonthFinalValue("PK_TAX", "  £0  "), { metricCode: "PK_TAX", value: 0 });
});

test("final value validation rejects malformed or invalid values", () => {
  assert.equal(validateSalesKpiMonthFinalValue("MONTHLY_PROFIT", "165,94.07"), null);
  assert.equal(validateSalesKpiMonthFinalValue("MONTHLY_PROFIT", "££165,942.07"), null);
  assert.equal(validateSalesKpiMonthFinalValue("MONTHLY_PROFIT", "not a number"), null);
  assert.equal(validateSalesKpiMonthFinalValue("MONTHLY_PROFIT", "-1"), null);
  assert.equal(validateSalesKpiMonthFinalValue("MONTHLY_PROFIT", ""), null);
});

test("final value validation accepts currency decimals and rejects fractional counts", () => {
  assert.deepEqual(validateSalesKpiMonthFinalValue("MONTHLY_PROFIT", "10.25"), { metricCode: "MONTHLY_PROFIT", value: 10.25 });
  assert.deepEqual(validateSalesKpiMonthFinalValue("PK_TAX", "0"), { metricCode: "PK_TAX", value: 0 });
  assert.equal(validateSalesKpiMonthFinalValue("QUOTES_DONE", "2.5"), null);
  assert.equal(validateSalesKpiMonthFinalValue("ORDERS_PROCESSED", "-1"), null);
});

test("final values are admin-only and isolated from ingestion payloads", async () => {
  const migration = await readFile("supabase/migrations/20260803100000_add_sales_kpi_month_final_values.sql", "utf8");
  const monday = await readFile("scripts/lib/monday/salesDashboardSync.ts", "utf8");
  const epcc = await readFile("src/features/sales-dashboard/server/epccProfitImporter.ts", "utf8");
  assert.match(migration, /sales_kpi_month_final_values_insert_admin/);
  assert.match(migration, /sales_kpi_month_final_values_update_admin/);
  assert.match(migration, /sales_kpi_month_final_values_delete_admin/);
  assert.match(migration, /has_pins_hub_access\('admin'\)/);
  assert.doesNotMatch(monday, /sales_kpi_month_final_values/);
  assert.doesNotMatch(epcc, /sales_kpi_month_final_values/);
});

test("final-value management is compact and keeps the modal accessible", async () => {
  const component = await readFile("src/features/sales-dashboard/components/MonthlyKpiFinals.tsx", "utf8");
  assert.match(component, />Final Values</);
  assert.match(component, /aria-labelledby="manage-final-values-title"/);
  assert.match(component, /max-h-\[calc\(100dvh-2rem\)\].*overflow-y-auto/);
  assert.match(component, /event\.key === "Escape"/);
  assert.match(component, /focusableSelector/);
  assert.match(component, /onMouseDown=\{dismissOnBackdrop\}/);
  assert.match(component, /router\.refresh\(\)/);
});
