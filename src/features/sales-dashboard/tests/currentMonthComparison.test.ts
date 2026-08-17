import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("Current Month Comparison uses persisted year-comparison data rather than a second calculation path", () => {
  const component = readFileSync(new URL("../components/CurrentMonthComparisonView.tsx", import.meta.url), "utf8");
  assert.match(component, /selectCurrentMonthComparison\(comparison, month\)/);
  assert.match(component, /formatYearComparisonValue/);
  assert.match(component, /Monthly profit/);
  assert.match(component, /Quotes done/);
  assert.match(component, /Orders processed/);
});

test("Current Month Comparison migration safely extends the existing TV settings set", () => {
  const migration = readFileSync("supabase/migrations/20260817110000_add_current_month_comparison_tv_slide.sql", "utf8");
  assert.match(migration, /'current-month-comparison'/);
  assert.match(migration, /jsonb_array_length\(p_settings\) <> 7/);
  assert.match(migration, /"current-month-comparison","is_enabled":true,"display_order":6/);
});
