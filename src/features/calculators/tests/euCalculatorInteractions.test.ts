import assert from "node:assert/strict";
import test from "node:test";
import {
  normaliseEuPrintColourInput,
  normaliseEuPkMarkupInput,
  shouldShowMissingGarmentError,
} from "../domain/euCalculatorInteractions.ts";

const profiles = ["EU_STANDARD", "EU_US_CLIENTS"] as const;

test("EU and US calculators normalize print colours and preserve temporary empty editing", () => {
  for (const profileCode of profiles) {
    assert.equal(profileCode.startsWith("EU"), true);
    assert.equal(normaliseEuPrintColourInput("06"), "6");
    assert.equal(normaliseEuPrintColourInput("001"), "1");
    assert.equal(normaliseEuPrintColourInput("10"), "9");
    assert.equal(normaliseEuPrintColourInput("99"), "9");
    assert.equal(normaliseEuPrintColourInput("0"), "");
    assert.equal(normaliseEuPrintColourInput("000"), "");
    assert.equal(normaliseEuPrintColourInput("a6b"), "6");
    for (let colourCount = 1; colourCount <= 9; colourCount += 1) {
      assert.equal(normaliseEuPrintColourInput(String(colourCount)), String(colourCount));
    }
    assert.equal(normaliseEuPrintColourInput(""), "");
  }
});

test("EU PK markup accepts signed decimal edit states and strips malformed characters", () => {
  assert.equal(normaliseEuPkMarkupInput(""), "");
  assert.equal(normaliseEuPkMarkupInput("-"), "-");
  assert.equal(normaliseEuPkMarkupInput("."), ".");
  assert.equal(normaliseEuPkMarkupInput("-."), "-.");
  assert.equal(normaliseEuPkMarkupInput("0.50"), "0.50");
  assert.equal(normaliseEuPkMarkupInput("-1.25"), "-1.25");
  assert.equal(normaliseEuPkMarkupInput("a-1..2b"), "1.2");
});

test("EU print and PK inputs use text controls without browser number spinners", async () => {
  const { readFile } = await import("node:fs/promises");
  const controls = await readFile(new URL("../components/PrintPositionControls.tsx", import.meta.url), "utf8");
  const itemCard = await readFile(new URL("../components/EuItemCard.tsx", import.meta.url), "utf8");
  assert.match(controls, /type="text"[\s\S]*inputMode="numeric"[\s\S]*pattern="\[0-9\]\*"/);
  assert.doesNotMatch(controls, /aria-label=\{`\$\{position\.label\} colours`\}[^>\n]*type="number"/);
  assert.match(itemCard, /type="text"[\s\S]*inputMode="decimal"/);
  assert.doesNotMatch(itemCard, /PK markup[\s\S]*type="number"/);
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
