import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const component = readFileSync(new URL("../components/CompanyProfitView.tsx", import.meta.url), "utf8");
const styles = readFileSync(new URL("../components/CompanyProfitView.module.css", import.meta.url), "utf8");
const gauge = readFileSync(new URL("../components/CompanyProfitGauge.tsx", import.meta.url), "utf8");
const gaugeStyles = readFileSync(new URL("../components/CompanyProfitGauge.module.css", import.meta.url), "utf8");

test("Company Profit view uses the source metric with its dedicated progress gauge", () => {
  assert.match(component, /<CompanyProfitGauge/);
  assert.match(component, /Math\.max\(current - target, 0\)/);
  assert.match(component, /Math\.max\(target - current, 0\)/);
  assert.match(component, /Company Profit/);
  assert.match(component, /Target Profit/);
  assert.match(component, /Bonus Profit/);
  assert.match(component, /Progress/);
  assert.match(gauge, /value \/ target/);
  assert.doesNotMatch(gauge, /target \* 1\.5/);
  assert.match(gauge, /className=\{styles\.marker\}/);
  assert.match(gauge, /Target exceeded/);
  assert.match(gauge, /pathLength="100"/);
  assert.match(gauge, /const TARGET_POSITION = 0\.5/);
  assert.match(gauge, /const completedArc = progress \* TARGET_POSITION \* 100/);
  assert.match(gauge, /strokeDasharray=\{`\$\{completedArc\} 100`\}/);
});

test("Company Profit view has a compact responsive gauge and metric layout", () => {
  assert.match(styles, /grid-template-columns: repeat\(4, minmax\(0, 1fr\)\)/);
  assert.match(styles, /@media \(max-width: 899px\)/);
  assert.match(styles, /@media \(max-width: 639px\)/);
});

test("Company Profit uses the established warm Pins Hub palette", () => {
  const palette = `${styles}\n${gaugeStyles}`;

  assert.doesNotMatch(palette, /#6fc49a|#8bd8b0|rgb\(111 196 154/);
  assert.match(styles, /\.value \{ color: hsl\(var\(--foreground\)\)/);
  assert.match(styles, /\.metricIcon [^\n]+color: hsl\(var\(--primary\)\)/);
  assert.match(styles, /\.metric\[data-state="success"\][^\n]+#d6c486/);
  assert.match(gaugeStyles, /\.fill \{ stroke: hsl\(var\(--primary\)\)/);
  assert.match(gaugeStyles, /\.marker \{ stroke: #d6c486/);
});
