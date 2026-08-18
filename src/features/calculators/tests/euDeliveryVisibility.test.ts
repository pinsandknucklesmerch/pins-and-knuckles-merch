import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const component = readFileSync(new URL("../components/EuCalculator.tsx", import.meta.url), "utf8");
const helper = readFileSync(new URL("../components/EuDeliveryHelper.tsx", import.meta.url), "utf8");
const item = readFileSync(new URL("../components/EuItemCard.tsx", import.meta.url), "utf8");
const itemCard = readFileSync(new URL("../components/CalculatorItemCard.tsx", import.meta.url), "utf8");

test("delivery is disabled by default and only renders after the checkbox is enabled", () => {
  assert.match(component, /useState\(false\)/);
  assert.doesNotMatch(item, /Include delivery costs/);
  assert.match(component, /checked=\{includeDeliveryCosts\}/);
  assert.match(component, /includeDeliveryCosts \? <EuDeliveryHelper/);
  assert.doesNotMatch(component, /<label className="flex min-w-0 w-full/);
});

test("unchecking delivery hides the helper while reset clears quote-level delivery state", () => {
  assert.match(component, /setIncludeDeliveryCosts\(false\)/);
  assert.match(component, /setDeliveryBoxCount\(1\)/);
  assert.doesNotMatch(component, /onIncludeDeliveryCostsChange/);
  assert.doesNotMatch(component, /CollapsibleSurface/);
  assert.doesNotMatch(helper, /CollapsibleSurface/);
});

test("delivery controls and results remain separate from calculator totals", () => {
  assert.match(component, /calculateEuStandardPrice\(/);
  assert.match(component, /<EuCalculatorResults items=\{validQuoteLines\} totals=\{totals\}/);
  assert.match(component, /<EuDeliveryHelper[\s\S]*deliveryRates=\{referenceData\.deliveryRates\}/);
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
  assert.match(item, /<CalculatorItemCard/);
  assert.match(itemCard, /flex min-w-0 flex-wrap items-center/);
  assert.match(results, /grid-cols-\[minmax\(0,1fr\)_auto\]/);
  assert.match(results, /whitespace-nowrap/);
  assert.match(results, /min-w-0 break-words text-sm font-semibold/);
});

test("one delivery helper stays beneath the complete item list and does not require another expander", () => {
  const itemListEnd = component.indexOf("</div>\n\n          <ActionButton");
  const addItem = component.indexOf("Add item", itemListEnd);
  const includeDelivery = component.indexOf("Include delivery costs", addItem);
  const helperRender = component.indexOf("{includeDeliveryCosts ? <EuDeliveryHelper", includeDelivery);
  assert.ok(itemListEnd >= 0 && itemListEnd < addItem && addItem < includeDelivery && includeDelivery < helperRender);
  assert.equal((component.match(/<EuDeliveryHelper/g) ?? []).length, 1);
  assert.match(helper, /<Surface aria-label="Delivery helper"/);
  assert.doesNotMatch(helper, /CollapsibleSurface/);
});

test("delivery controls use responsive, non-wrapping value cells", () => {
  assert.match(helper, /grid-cols-1 gap-3 sm:grid-cols-2 2xl:grid-cols-4/);
  assert.match(helper, /whitespace-nowrap/);
  assert.match(helper, /grid-cols-\[minmax\(0,1fr\)_auto\]/);
  assert.match(helper, /Number of boxes[\s\S]*Cost per box[\s\S]*Delivery time[\s\S]*Delivery markup/);
  assert.match(helper, /gap-1\.5/);
});

test("delivery state is controlled by the calculator rather than stored on an item", () => {
  assert.match(component, /const \[deliveryCountry, setDeliveryCountry\]/);
  assert.match(component, /const \[deliveryBoxCount, setDeliveryBoxCount\]/);
  assert.match(helper, /onBoxCountChange/);
  assert.doesNotMatch(item, /delivery|Delivery/);
});
