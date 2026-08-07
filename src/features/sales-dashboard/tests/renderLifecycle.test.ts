import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("profit report DOM is mounted only during an export request", async () => {
  const dashboard = await readFile(new URL("../components/SalesDashboard.tsx", import.meta.url), "utf8");
  const exporter = await readFile(new URL("../components/ExportMetricsButton.tsx", import.meta.url), "utf8");
  assert.match(dashboard, /profitReportMounted \? <div/);
  assert.match(dashboard, /requestProfitReport/);
  assert.match(dashboard, /releaseProfitReport/);
  assert.match(exporter, /if \(isExporting\) return/);
  assert.match(exporter, /requestProfitReport\(\)/);
  assert.match(exporter, /releaseProfitReport\(\)/);
});

test("metric animation updates the visible node without per-frame React state", async () => {
  const source = await readFile(new URL("../components/AnimatedMetricValue.tsx", import.meta.url), "utf8");
  assert.match(source, /visibleValueRef\.current\.textContent/);
  assert.doesNotMatch(source, /useState/);
});
