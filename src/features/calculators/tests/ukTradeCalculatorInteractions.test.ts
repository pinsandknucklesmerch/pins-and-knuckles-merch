import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { toggleUkTradeEmbroidery, toggleUkTradePrintPosition } from "../domain/ukTradeCalculatorInteractions.ts";

test("UK decoration selection supports multiple print positions and safe deselection", () => {
  let positions = toggleUkTradePrintPosition([{ position: "FRONT", colourCount: 2 }], "BACK", true);
  assert.deepEqual(positions.map((entry) => entry.position), ["FRONT", "BACK"]);
  positions = toggleUkTradePrintPosition(positions, "FRONT", false);
  assert.deepEqual(positions.map((entry) => entry.position), ["BACK"]);
});

test("UK embroidery selection supports multiple slots and safe deselection", () => {
  let stitches: Array<number | null> = [null, null, null];
  stitches = toggleUkTradeEmbroidery(stitches, 0, true);
  stitches = toggleUkTradeEmbroidery(stitches, 1, true);
  assert.deepEqual(stitches, [7000, 7000, null]);
  assert.deepEqual(toggleUkTradeEmbroidery(stitches, 0, false), [null, 7000, null]);
});

test("UK neck and transfer positions remain distinct", () => {
  const positions = toggleUkTradePrintPosition([], "NECK_PRINT_STANDARD", true);
  assert.deepEqual(toggleUkTradePrintPosition(positions, "NECK_PRINT_TRANSFER", true), [
    { position: "NECK_PRINT_STANDARD" },
    { position: "NECK_PRINT_TRANSFER" },
  ]);
});

test("UK Trade results use a two-card summary and one native final-total copy activation", () => {
  const calculator = readFileSync(new URL("../components/UkTradeCalculator.tsx", import.meta.url), "utf8");
  assert.match(calculator, /grid gap-3 sm:grid-cols-2/);
  assert.match(calculator, />Quantity subtotal</);
  assert.match(calculator, />Final total</);
  assert.doesNotMatch(calculator, />Setup</);
  assert.doesNotMatch(calculator, />VAT</);
  assert.match(calculator, /<button type="button" onClick=\{\(\) => void copyQuote\(\)\}/);
  assert.match(calculator, /Click to copy/);
  assert.equal((calculator.match(/copyQuote\(\)/g) ?? []).length, 2);
});

test("UK Trade breakdown keeps setup and VAT there and marks only unit-price values with Pins red", () => {
  const breakdown = readFileSync(new URL("../components/UkTradeBreakdown.tsx", import.meta.url), "utf8");
  assert.match(breakdown, /Setup \(excl\. VAT\)/);
  assert.match(breakdown, /VAT/);
  assert.match(breakdown, /label="Unit price \(excl\. setup & VAT\)"[^>]*valueClassName="text-primary"/);
});
