import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const component = readFileSync(new URL("../components/EuCalculator.tsx", import.meta.url), "utf8");
const helper = readFileSync(new URL("../components/EuDeliveryHelper.tsx", import.meta.url), "utf8");
const item = readFileSync(new URL("../components/EuItemCard.tsx", import.meta.url), "utf8");

test("delivery is disabled by default and only renders after the checkbox is enabled", () => {
  assert.match(component, /useState<Record<string, boolean>>\(\{\}\)/);
  assert.match(item, /Include delivery costs/);
  assert.match(component, /includeDeliveryCosts\[item\.id\] \? <EuDeliveryHelper/);
  assert.doesNotMatch(component, /<label className="flex min-w-0 w-full/);
});

test("unchecking delivery resets the delivery helper by unmounting it and reset clears the option", () => {
  assert.match(component, /setIncludeDeliveryCosts\(\{\}\)/);
  assert.match(component, /onIncludeDeliveryCostsChange/);
  assert.doesNotMatch(component, /CollapsibleSurface/);
  assert.doesNotMatch(helper, /CollapsibleSurface/);
});

test("delivery controls and results remain separate from calculator totals", () => {
  assert.match(component, /calculateEuStandardPrice\(/);
  assert.match(component, /<EuCalculatorResults items=\{validQuoteLines\} totals=\{totals\}/);
  assert.match(component, /<EuDeliveryHelper deliveryRates=\{referenceData\.deliveryRates\}/);
  assert.doesNotMatch(component.slice(component.indexOf("const calculations"), component.indexOf("return (")), /includeDeliveryCosts/);
});

test("both EU profiles use the shared delivery behaviour", () => {
  const standard = readFileSync(new URL("../../../app/(hub)/hub/calculators/eu/standard/page.tsx", import.meta.url), "utf8");
  const usClients = readFileSync(new URL("../../../app/(hub)/hub/calculators/eu/us-clients/page.tsx", import.meta.url), "utf8");
  assert.match(standard, /<EuCalculator referenceData=\{referenceData\}/);
  assert.match(usClients, /<EuCalculator referenceData=\{data\} profileCode="EU_US_CLIENTS"/);
});

test("EU calculator controls use wrapping and min-width-safe layouts", () => {
  const item = readFileSync(new URL("../components/EuItemCard.tsx", import.meta.url), "utf8");
  const results = readFileSync(new URL("../components/EuCalculatorResults.tsx", import.meta.url), "utf8");
  assert.match(item, /grid min-w-0 gap-4 md:grid-cols-\[minmax\(0,1fr\)_minmax\(0,140px\)\]/);
  assert.match(item, /flex min-w-0 flex-wrap items-center/);
  assert.match(results, /grid-cols-\[minmax\(0,1fr\)_auto\]/);
  assert.match(results, /whitespace-nowrap/);
  assert.match(results, /min-w-0 break-words text-sm font-semibold/);
});

test("delivery helper stays directly beneath its item and does not require another expander", () => {
  assert.match(component, /<EuItemCard[\s\S]*?\/>\s*\{includeDeliveryCosts\[item\.id\] \? <EuDeliveryHelper/);
  assert.match(helper, /<Surface aria-label="Delivery helper"/);
  assert.doesNotMatch(helper, /CollapsibleSurface/);
});

test("delivery controls use responsive, non-wrapping value cells", () => {
  assert.match(helper, /sm:grid-cols-1 md:grid-cols-2/);
  assert.match(helper, /whitespace-nowrap/);
  assert.match(helper, /grid-cols-\[minmax\(0,1fr\)_auto\]/);
});
