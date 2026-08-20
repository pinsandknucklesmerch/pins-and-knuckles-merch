import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const component = readFileSync(new URL("../components/ProfitShirtKpi.tsx", import.meta.url), "utf8");
const styles = readFileSync(new URL("../components/ProfitShirtKpi.module.css", import.meta.url), "utf8");

test("Monthly Profit card contains only its value, target progress, and shirt visual", () => {
  assert.match(component, /Monthly Profit/);
  assert.match(component, /<AnimatedMetricValue/);
  assert.match(component, /profitProgress/);
  assert.match(component, /<MonthlyProfitTshirt/);
  assert.doesNotMatch(component, /ComparisonBadge|previousYear|percentageChange|Last year|aboveTarget/);
  assert.doesNotMatch(styles, /\.comparison|\.aboveTarget|border-top/);
  assert.match(styles, /height: 100%/);
  assert.match(styles, /grid-template-rows: auto auto auto minmax\(0, 1fr\)/);
});
