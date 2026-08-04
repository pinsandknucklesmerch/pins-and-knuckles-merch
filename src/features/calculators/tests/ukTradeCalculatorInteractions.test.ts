import assert from "node:assert/strict";
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
