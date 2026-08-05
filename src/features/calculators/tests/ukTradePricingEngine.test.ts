import assert from "node:assert/strict";
import test from "node:test";
import { calculateUkTradeItem } from "../domain/ukTradePricingEngine.ts";
import { formatUkTradeQuote } from "../domain/ukTradeQuoteFormatter.ts";
import type { UkTradeItemInput, UkTradeReferenceData } from "../domain/types.ts";

const data: UkTradeReferenceData = {
  profile: { id: "uk", code: "UK_TRADE", name: "UK Trade", region: "UK", currencyCode: "GBP", vatRate: null, minQuantity: 50, maxQuantity: 10000, maxColours: 10, tierStrategy: "floor", copyFormatterCode: "uk_trade", supportsDelivery: false, supportsPkMarkup: false, supportsEmbroidery: true, supportsScreenSetup: true, isActive: true, isDeferred: false },
  priceSets: [], fees: [{ calculatorProfileId: "uk", feeCode: "UK_SCREEN_SETUP", feeLabel: "Screen", amount: 20, currencyCode: "GBP", appliesPer: "screen", costSide: "trade" }, { calculatorProfileId: "uk", feeCode: "UK_EMBROIDERY_SETUP", feeLabel: "Embroidery", amount: 30, currencyCode: "GBP", appliesPer: "embroidery_item", costSide: "trade" }],
  garments: [{ id: "g", code: "5001", altCode: "", brandName: "AS Colour", name: "Staple Tee", colour: "", garmentType: "TSHIRT", eurBasePrice: null, gbpPrice: 2, extraSizeCost: null, tags: "" }],
  printTiers: [50, 100, 200, 500, 1000, 2500, 5000, 10000].flatMap((tier) => [{ pricingSetCode: "p", positionCode: "STANDARD" as const, colourCount: 1, quantityTier: tier, unitPrice: tier === 100 ? .93 : tier === 10000 ? .56 : 1.47, setupScreenCountStrategy: "colour_count" as const }, { pricingSetCode: "p", positionCode: "NECK_PRINT_STANDARD" as const, colourCount: 1, quantityTier: tier, unitPrice: .89, setupScreenCountStrategy: "one" as const }, { pricingSetCode: "p", positionCode: "NECK_PRINT_TRANSFER" as const, colourCount: null, quantityTier: tier, unitPrice: 1.34, setupScreenCountStrategy: "none" as const }]),
  embroideryTiers: [50, 100, 200, 500, 1000, 2500].flatMap((tier) => [{ pricingSetCode: "e", stitchCount: 7000, isExtra1000Stitches: false, quantityTier: tier, unitPrice: tier === 2500 ? 1.82 : 2.15 }, { pricingSetCode: "e", stitchCount: 8000, isExtra1000Stitches: false, quantityTier: tier, unitPrice: 2.37 }, { pricingSetCode: "e", stitchCount: 15000, isExtra1000Stitches: false, quantityTier: tier, unitPrice: 3.93 }, { pricingSetCode: "e", stitchCount: 1000, isExtra1000Stitches: true, quantityTier: tier, unitPrice: .21 }]),
};
const item = (overrides: Partial<UkTradeItemInput> = {}): UkTradeItemInput => ({ id: "i", garmentId: "g", quantity: 50, printPositions: [{ position: "FRONT", colourCount: 1 }], embroideryStitches: [null, null, null], ...overrides });

test("UK print uses floor tiers and includes underbase setup", () => { const result = calculateUkTradeItem(item({ quantity: 100 }), data); assert.equal(result.printCost, 93); assert.equal(result.screenSetupCount, 2); assert.equal(result.screenSetupCost, 40); });
test("UK screen setup is separate from the garment unit price while retaining the overall total", () => {
  const result = calculateUkTradeItem(item(), data);
  assert.equal(result.unitPriceExcludingScreenSetup, 3.47);
  assert.equal(result.garmentSubtotalExVat, 173.5);
  assert.equal(result.garmentSubtotalIncVat, 208.2);
  assert.equal(result.screenSetupCost, 40);
  assert.equal(result.screenSetupTotalIncVat, 48);
  assert.equal(result.vatAmount, 42.7);
  assert.equal(result.totalCost, 213.5);
  assert.equal(result.totalCostIncVat, 256.2);
});
test("UK trade keeps the acceptance-case combined total while separating four screens", () => {
  const acceptanceData: UkTradeReferenceData = { ...data, printTiers: data.printTiers.map((tier) => tier.quantityTier === 50 && tier.positionCode === "STANDARD" ? { ...tier, unitPrice: 1.45 } : tier) };
  const result = calculateUkTradeItem(item({ printPositions: [{ position: "FRONT", colourCount: 1 }, { position: "BACK", colourCount: 1 }] }), acceptanceData);
  assert.equal(result.unitPriceExcludingScreenSetup, 4.9);
  assert.equal(result.garmentSubtotalExVat, 245);
  assert.equal(result.garmentSubtotalIncVat, 294);
  assert.equal(result.screenSetupCount, 4);
  assert.equal(result.screenSetupCost, 80);
  assert.equal(result.screenSetupTotalIncVat, 96);
  assert.equal(result.totalCostIncVat, 390);
});
test("UK result breakdown retains per-item pricing details", () => { const result = calculateUkTradeItem(item({ quantity: 100, printPositions: [{ position: "FRONT", colourCount: 1 }], embroideryStitches: [7500, null, null] }), data); assert.deepEqual(result.printBreakdowns, [{ position: "FRONT", colourCount: 1, unitPrice: .93, cost: 93, screenSetupCount: 2 }]); assert.deepEqual(result.embroideryBreakdowns, [{ stitches: 7500, unitPrice: 2.37, cost: 237, setupCost: 30 }]); assert.equal(result.totalCost, 600); });
test("UK print supports the highest floor tier", () => { assert.ok(Math.abs(calculateUkTradeItem(item({ quantity: 12000 }), data).printCost - 6720) < 1e-9); });
test("UK neck and transfer preserve legacy setup rules", () => { const neck = calculateUkTradeItem(item({ printPositions: [{ position: "NECK_PRINT_STANDARD" }] }), data); const transfer = calculateUkTradeItem(item({ printPositions: [{ position: "NECK_PRINT_TRANSFER" }] }), data); assert.equal(neck.screenSetupCount, 2); assert.equal(transfer.screenSetupCost, 0); assert.equal(transfer.printCost, 67); assert.equal(transfer.unitPriceExcludingScreenSetup, transfer.totalCost / transfer.quantity); });
test("UK embroidery rounds stitches and charges setup per position", () => { const result = calculateUkTradeItem(item({ printPositions: [], embroideryStitches: [7500, 16000, null] }), data); assert.equal(result.embroideryCost, (2.37 + 4.14) * 50); assert.equal(result.embroiderySetupCost, 60); });
test("UK embroidery quantities above 2500 use the 2500 tier", () => { const result = calculateUkTradeItem(item({ quantity: 3000, printPositions: [], embroideryStitches: [7000, null, null] }), data); assert.equal(result.embroideryCost, 5460); });
test("UK quote separates plural screen setup from the garment line", () => {
  const result = calculateUkTradeItem(item(), data);
  assert.equal(formatUkTradeQuote([item({ itemLabel: "Tour Shirt" })], [result], data.garments), "Tour Shirt:\n\n5001 AS Colour Staple Tee (1 Col Front)\n50 x £3.47 + vat ea (£208.20 inc VAT)\n2 x screens @ £20.00 + vat ea / £48.00 total (inc VAT)");
});
test("UK quote uses singular screen wording and omits setup for zero-screen items", () => {
  const result = calculateUkTradeItem(item(), data);
  const oneScreen = { ...result, screenSetupCount: 1, screenSetupCost: 20, screenSetupTotalIncVat: 24, vatAmount: 38.7, totalCost: 193.5, totalCostIncVat: 232.2 };
  assert.match(formatUkTradeQuote([item()], [oneScreen], data.garments), /1 x screen @ £20\.00/);
  const embroideryOnly = calculateUkTradeItem(item({ printPositions: [], embroideryStitches: [7500, null, null] }), data);
  const quote = formatUkTradeQuote([item({ printPositions: [], embroideryStitches: [7500, null, null] })], [embroideryOnly], data.garments);
  assert.doesNotMatch(quote, /screen/);
  assert.equal(embroideryOnly.unitPriceExcludingScreenSetup, embroideryOnly.totalCost / embroideryOnly.quantity);
});
test("UK invalid items and copy are explicit", () => { const invalid = calculateUkTradeItem(item({ garmentId: null }), data); assert.equal(invalid.errors[0].message, "Select garment."); assert.equal(formatUkTradeQuote([item()], [invalid], data.garments), ""); });
