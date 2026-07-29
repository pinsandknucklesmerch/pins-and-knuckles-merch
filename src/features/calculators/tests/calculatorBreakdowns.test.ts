import assert from "node:assert/strict";
import test from "node:test";
import { buildEuBreakdown, buildUkTradeBreakdown } from "../domain/calculatorBreakdowns.ts";
import type { EuQuoteLine } from "../domain/euQuoteFormatter.ts";
import type { UkTradeItemInput, UkTradeItemResult } from "../domain/types.ts";

const totals = { productionSubtotalExVat: 50, customerSubtotalExVat: 75, vatRate: 27, vatAmount: 20.25, customerTotalIncVat: 95.25, profitExVat: 25 };
const line = { input: { id: "eu-1", garmentId: "g", quantity: 10, printPositions: [], embroideryItems: [] }, garment: { id: "g", code: "G", altCode: "", brandName: "", name: "Garment", colour: "", garmentType: "TSHIRT" as const, eurBasePrice: 2, gbpPrice: null, extraSizeCost: null, tags: "" }, result: { itemId: "eu-1", garmentId: "g", quantity: 10, baseCost: 20, garmentMarkupCost: 10, pkMarkupCost: 0, printProductionCost: 30, printCustomerCost: 45, embroideryProductionCost: 0, embroideryCustomerCost: 0, digitisingProductionCost: 0, digitisingCustomerCost: 0, productionSubtotalExVat: 50, customerSubtotalExVat: 75, profitExVat: 25, printBreakdowns: [], embroideryBreakdowns: [] } } satisfies EuQuoteLine;

test("EU breakdown values reconcile with existing totals without changing quote math", () => {
  const breakdown = buildEuBreakdown([line], totals);
  assert.equal(breakdown.productionItems[0].subtotal, totals.productionSubtotalExVat);
  assert.equal(breakdown.pinsItems[0].subtotal, totals.customerSubtotalExVat);
  assert.equal(breakdown.totals.customerSubtotalExVat - breakdown.totals.productionSubtotalExVat, breakdown.totals.profitExVat);
  assert.equal(breakdown.totals.customerSubtotalExVat + breakdown.totals.vatAmount, breakdown.totals.customerTotalIncVat);
});

test("UK breakdown aggregates valid items and excludes invalid items", () => {
  const items: UkTradeItemInput[] = [{ id: "valid", garmentId: "g", quantity: 50, printPositions: [], embroideryStitches: [null, null, null] }, { id: "invalid", garmentId: null, quantity: 50, printPositions: [], embroideryStitches: [null, null, null] }];
  const results: UkTradeItemResult[] = [{ itemId: "valid", garmentId: "g", quantity: 50, garmentCost: 100, printCost: 50, screenSetupCount: 2, screenSetupCost: 40, embroideryCost: 20, embroiderySetupCost: 30, totalCost: 240, printBreakdowns: [], embroideryBreakdowns: [], errors: [] }, { itemId: "invalid", garmentId: "", quantity: 50, garmentCost: 0, printCost: 0, screenSetupCount: 0, screenSetupCost: 0, embroideryCost: 0, embroiderySetupCost: 0, totalCost: 0, printBreakdowns: [], embroideryBreakdowns: [], errors: [{ code: "MISSING_GARMENT", message: "Select garment." }] }];
  const breakdown = buildUkTradeBreakdown(items, results, 20);
  assert.equal(breakdown.total, 240);
  assert.equal(breakdown.printCost, 50);
  assert.equal(breakdown.screenSetupCount, 2);
  assert.equal(breakdown.screenSetupCost, 40);
  assert.equal(breakdown.embroideryCost, 20);
  assert.equal(breakdown.embroiderySetupCost, 30);
  assert.equal(breakdown.unitCost, 4.8);
  assert.equal(breakdown.validItems.length, 1);
});
