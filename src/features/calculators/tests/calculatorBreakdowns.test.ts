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
  const valid: UkTradeItemResult = { itemId: "valid", garmentId: "g", quantity: 50, garmentCost: 100, printCost: 50, embroideryCost: 20, unitPriceExVatExcludingSetup: 3.4, quantitySubtotalExVatExcludingSetup: 170, quantityTotalIncVatExcludingSetup: 204, screenCount: 2, screenSetupUnitExVat: 20, screenSetupSubtotalExVat: 40, screenSetupTotalIncVat: 48, embroiderySetupCount: 1, embroiderySetupUnitExVat: 30, embroiderySetupSubtotalExVat: 30, embroiderySetupTotalIncVat: 36, totalSetupExVat: 70, totalSetupIncVat: 84, itemSubtotalExVat: 240, itemVat: 48, itemTotalIncVat: 288, printBreakdowns: [], embroideryBreakdowns: [], errors: [] };
  const invalid: UkTradeItemResult = { ...valid, itemId: "invalid", garmentId: "", garmentCost: 0, printCost: 0, embroideryCost: 0, unitPriceExVatExcludingSetup: 0, quantitySubtotalExVatExcludingSetup: 0, quantityTotalIncVatExcludingSetup: 0, screenCount: 0, screenSetupSubtotalExVat: 0, screenSetupTotalIncVat: 0, embroiderySetupCount: 0, embroiderySetupSubtotalExVat: 0, embroiderySetupTotalIncVat: 0, totalSetupExVat: 0, totalSetupIncVat: 0, itemSubtotalExVat: 0, itemVat: 0, itemTotalIncVat: 0, errors: [{ code: "MISSING_GARMENT", message: "Select garment." }] };
  const breakdown = buildUkTradeBreakdown(items, [valid, invalid]);
  assert.equal(breakdown.itemSubtotalExVat, 240);
  assert.equal(breakdown.printCost, 50);
  assert.equal(breakdown.screenCount, 2);
  assert.equal(breakdown.screenSetupSubtotalExVat, 40);
  assert.equal(breakdown.embroideryCost, 20);
  assert.equal(breakdown.embroiderySetupSubtotalExVat, 30);
  assert.equal(breakdown.unitCost, 3.4);
  assert.equal(breakdown.quantityTotalIncVatExcludingSetup, 204);
  assert.equal(breakdown.totalIncVat, 288);
  assert.equal(breakdown.validItems.length, 1);
});
