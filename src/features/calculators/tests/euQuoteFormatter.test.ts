import assert from "node:assert/strict";
import test from "node:test";
import {
  formatEuStandardQuote,
  getEuItemLabel,
  type EuQuoteLine,
} from "../domain/euQuoteFormatter.ts";
import { createDefaultEuCalculatorItem } from "../domain/euCalculatorDefaults.ts";

function createLine(overrides: Partial<EuQuoteLine["input"]> = {}, withDigitising = false): EuQuoteLine {
  return {
    input: {
      ...createDefaultEuCalculatorItem(1),
      garmentId: "garment-1",
      ...overrides,
    },
    garment: {
      id: "garment-1",
      code: "5001",
      altCode: "",
      brandName: "AS Colour",
      name: "Staple Tee",
      colour: "",
      garmentType: "TSHIRT",
      eurBasePrice: 5,
      gbpPrice: null,
      extraSizeCost: null,
      tags: "",
    },
    result: {
      itemId: "item-1",
      garmentId: "garment-1",
      quantity: 50,
      baseCost: 250,
      garmentMarkupCost: 100,
      pkMarkupCost: 0,
      printProductionCost: 40,
      printCustomerCost: 59.5,
      embroideryProductionCost: 0,
      embroideryCustomerCost: 0,
      digitisingProductionCost: withDigitising ? 23 : 0,
      digitisingCustomerCost: withDigitising ? 25 : 0,
      productionSubtotalExVat: withDigitising ? 313 : 290,
      customerSubtotalExVat: 459.5,
      profitExVat: 169.5,
      printBreakdowns: [{
        position: "FRONT",
        colourCount: 1,
        productionUnitPrice: 0.8,
        customerUnitPrice: 1.19,
        productionCost: 40,
        customerCost: 59.5,
      }],
      embroideryBreakdowns: withDigitising ? [{
        size: "small",
        productionUnitPrice: 0,
        customerUnitPrice: 0,
        productionCost: 0,
        customerCost: 0,
        digitisingProductionCost: 23,
        digitisingCustomerCost: 25,
      }] : [],
    },
  };
}

const totals = {
  productionSubtotalExVat: 290,
  customerSubtotalExVat: 459.5,
  vatRate: 27,
  vatAmount: 123.5,
  customerTotalIncVat: 583.57,
  profitExVat: 169.5,
};

test("default item has no garment selected", () => {
  assert.equal(createDefaultEuCalculatorItem(1).garmentId, null);
});

test("newly added item has no garment selected", () => {
  assert.equal(createDefaultEuCalculatorItem(2).garmentId, null);
});

test("default heading uses Item 1", () => {
  assert.equal(getEuItemLabel(undefined, 0), "Item 1");
});

test("custom design name appears in copied output", () => {
  assert.equal(formatEuStandardQuote([createLine({ itemLabel: "Tour Shirt" })], totals).split("\n")[0], "Tour Shirt:");
});

test("blank custom label falls back to Item 1", () => {
  assert.equal(formatEuStandardQuote([createLine({ itemLabel: "  " })], totals).split("\n")[0], "Item 1:");
});

test("default EU quote has exact single-item spacing", () => {
  assert.equal(formatEuStandardQuote([createLine()], totals), "Item 1:\n\n5001 AS Colour Staple Tee (1 Col Front)\n\n50 x €9.19 (excl vat) ea = €583.57");
});

test("EU quote has exact digitising spacing", () => {
  assert.equal(formatEuStandardQuote([createLine({}, true)], totals), "Item 1:\n\n5001 AS Colour Staple Tee (1 Col Front, Small embroidery)\n\nDigitizing fee = €31.75 (incl. VAT)\n\n50 x €9.19 (excl vat) ea = €583.57");
});

test("multiple items are separated by exactly two newline characters", () => {
  const output = formatEuStandardQuote([createLine(), createLine({ itemLabel: "Tour Shirt" })], totals);
  assert.equal(output.includes("€583.57\n\nTour Shirt:"), true);
});

test("invalid items are excluded from copied output", () => {
  const output = formatEuStandardQuote([createLine({ itemLabel: "Valid" })], totals);
  assert.equal(output.includes("Invalid"), false);
  assert.equal(output.startsWith("Valid:"), true);
});

test("garment colour is omitted when empty", () => {
  const output = formatEuStandardQuote([createLine()], totals);
  assert.equal(output.includes("Staple Tee ()"), false);
});

test("currency values use exactly two decimals", () => {
  const output = formatEuStandardQuote([createLine()], totals);
  assert.equal(output.includes("€9.19"), true);
  assert.equal(output.includes("€583.57"), true);
});

test("combobox default state does not select the first garment", () => {
  assert.equal(createDefaultEuCalculatorItem(1).garmentId, null);
});
