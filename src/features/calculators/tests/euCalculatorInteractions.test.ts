import assert from "node:assert/strict";
import test from "node:test";
import {
  normaliseEuPrintColourInput,
  shouldShowMissingGarmentError,
} from "../domain/euCalculatorInteractions.ts";

const profiles = ["EU_STANDARD", "EU_US_CLIENTS"] as const;

test("EU and US calculators cap print colours at nine and preserve 1 through 9", () => {
  for (const profileCode of profiles) {
    assert.equal(profileCode.startsWith("EU"), true);
    assert.equal(normaliseEuPrintColourInput("10"), 9);
    assert.equal(normaliseEuPrintColourInput("99"), 9);
    for (let colourCount = 1; colourCount <= 9; colourCount += 1) {
      assert.equal(normaliseEuPrintColourInput(String(colourCount)), colourCount);
    }
    assert.equal(normaliseEuPrintColourInput(""), null);
  }
});

test("EU and US calculators only show missing garment after a relevant action", () => {
  for (const profileCode of profiles) {
    assert.equal(profileCode.startsWith("EU"), true);
    assert.equal(shouldShowMissingGarmentError({ garmentId: null }), false);
    assert.equal(shouldShowMissingGarmentError({ garmentId: null, attemptedAddItem: true }), true);
    assert.equal(shouldShowMissingGarmentError({ garmentId: null, attemptedPrintSelection: true }), true);
    assert.equal(shouldShowMissingGarmentError({ garmentId: "garment-1", attemptedAddItem: true }), false);
    assert.equal(shouldShowMissingGarmentError({ garmentId: "garment-1", attemptedPrintSelection: true }), false);
  }
});
