import assert from "node:assert/strict";
import test from "node:test";
import { buildAlignedEuBreakdownRows } from "../lib/euBreakdownRows.ts";
import type { EuQuoteLine } from "../domain/euQuoteFormatter.ts";

const line = {
  input: { id: "item-1", garmentId: "garment-1", quantity: 50, printPositions: [], embroideryItems: [], pkMarkupEnabled: true },
  garment: { id: "garment-1", code: "G", altCode: "", brandName: "", name: "Garment", colour: "", garmentType: "TSHIRT" as const, eurBasePrice: 7.45, gbpPrice: null, extraSizeCost: null, tags: "" },
  result: {
    itemId: "item-1", garmentId: "garment-1", quantity: 50, baseCost: 372.5, garmentMarkupCost: 150, pkMarkupCost: 25,
    printProductionCost: 70, printCustomerCost: 77, embroideryProductionCost: 20, embroideryCustomerCost: 25,
    digitisingProductionCost: 10, digitisingCustomerCost: 12, productionSubtotalExVat: 472.5, customerSubtotalExVat: 661.5, profitExVat: 189,
    printBreakdowns: [{ position: "FRONT" as const, colourCount: 1, productionUnitPrice: 1.4, customerUnitPrice: 1.54, productionCost: 70, customerCost: 77 }],
    embroideryBreakdowns: [{ size: "small" as const, productionUnitPrice: 0.4, customerUnitPrice: 0.5, productionCost: 20, customerCost: 25, digitisingProductionCost: 10, digitisingCustomerCost: 12 }],
  },
} satisfies EuQuoteLine;

const production = { baseUnitPrice: 7.45, unitCost: 9.45, subtotal: 472.5, digitising: 10 };
const pins = { baseUnitPrice: 7.45, garmentMarkupUnitPrice: 3, pkMarkupUnitPrice: 0.5, unitCost: 13.23, subtotal: 661.5, digitisingInclVat: 15.24 };

test("EU breakdown rows share stable semantic keys and retain empty Production markup slots", () => {
  const rows = buildAlignedEuBreakdownRows(line, production, pins);
  assert.deepEqual(rows.map((row) => row.key), ["garment-base", "garment-markup", "pk-markup", "print-front", "embroidery-small-1", "digitising", "unit-cost", "subtotal"]);
  assert.equal(rows.find((row) => row.key === "garment-base")?.production?.label, "Garment base price / unit");
  assert.equal(rows.find((row) => row.key === "garment-markup")?.production, undefined);
  assert.equal(rows.find((row) => row.key === "pk-markup")?.production, undefined);
  assert.equal(rows.find((row) => row.key === "print-front")?.pins?.label, "Front · 1 colour");
  assert.equal(rows.find((row) => row.key === "embroidery-small-1")?.production?.label, "small embroidery");
  assert.equal(rows.find((row) => row.key === "unit-cost")?.production?.label, "Unit cost excl. VAT");
  assert.equal(rows.find((row) => row.key === "unit-cost")?.pins?.label, "Unit cost excl. VAT");
  assert.equal(rows.find((row) => row.key === "subtotal")?.production?.label, "Item subtotal excl. VAT");
  assert.equal(rows.find((row) => row.key === "subtotal")?.production?.amount, 472.5);
});
