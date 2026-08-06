import assert from "node:assert/strict";
import test from "node:test";
import { calculateUkTradeItem } from "../domain/ukTradePricingEngine.ts";
import { formatUkTradeQuote } from "../domain/ukTradeQuoteFormatter.ts";
import type { UkTradeItemInput, UkTradeReferenceData } from "../domain/types.ts";

const printTiers = [50, 100, 200, 500, 1000, 2500, 5000, 10000];
const printOneColour = [1.47, .93, .75, .68, .60, .59, .58, .56];
const printTenColour = [2.91, 2.28, 1.92, 1.67, 1.50, 1.40, 1.30, 1.19];
const embroideryTiers = [50, 100, 200, 500, 1000, 2500];
const embroidery7000 = [2.15, 2.04, 1.87, 1.82, 1.82, 1.82];
const embroidery15000 = [3.93, 3.82, 3.65, 3.60, 3.52, 3.52];
const extra1000 = [.21, .20, .19, .18, .17, .16];

const data: UkTradeReferenceData = {
  profile: { id: "uk", code: "UK_TRADE", name: "UK Trade", region: "UK", currencyCode: "GBP", vatRate: null, minQuantity: 50, maxQuantity: 10000, maxColours: 10, tierStrategy: "floor", copyFormatterCode: "uk_trade", supportsDelivery: false, supportsPkMarkup: false, supportsEmbroidery: true, supportsScreenSetup: true, isActive: true, isDeferred: false },
  priceSets: [],
  fees: [{ calculatorProfileId: "uk", feeCode: "UK_SCREEN_SETUP", feeLabel: "Screen", amount: 20, currencyCode: "GBP", appliesPer: "screen", costSide: "trade" }, { calculatorProfileId: "uk", feeCode: "UK_EMBROIDERY_SETUP", feeLabel: "Embroidery", amount: 30, currencyCode: "GBP", appliesPer: "embroidery_item", costSide: "trade" }],
  garments: [{ id: "g", code: "GD01", altCode: "", brandName: "Gildan", name: "SoftStyle Adult T-Shirt", colour: "Colours", garmentType: "TSHIRT", eurBasePrice: null, gbpPrice: 2, extraSizeCost: null, tags: "" }],
  printTiers: printTiers.flatMap((quantityTier, index) => [
    { pricingSetCode: "p", positionCode: "STANDARD" as const, colourCount: 1, quantityTier, unitPrice: printOneColour[index], setupScreenCountStrategy: "colour_count" as const },
    { pricingSetCode: "p", positionCode: "STANDARD" as const, colourCount: 10, quantityTier, unitPrice: printTenColour[index], setupScreenCountStrategy: "colour_count" as const },
    { pricingSetCode: "p", positionCode: "NECK_PRINT_STANDARD" as const, colourCount: 1, quantityTier, unitPrice: quantityTier === 50 ? .89 : .60, setupScreenCountStrategy: "one" as const },
    { pricingSetCode: "p", positionCode: "NECK_PRINT_TRANSFER" as const, colourCount: null, quantityTier, unitPrice: quantityTier === 50 ? 1.34 : .90, setupScreenCountStrategy: "none" as const },
  ]),
  embroideryTiers: embroideryTiers.flatMap((quantityTier, index) => [
    { pricingSetCode: "e", stitchCount: 7000, isExtra1000Stitches: false, quantityTier, unitPrice: embroidery7000[index] },
    { pricingSetCode: "e", stitchCount: 8000, isExtra1000Stitches: false, quantityTier, unitPrice: embroidery7000[index] + .22 },
    { pricingSetCode: "e", stitchCount: 15000, isExtra1000Stitches: false, quantityTier, unitPrice: embroidery15000[index] },
    { pricingSetCode: "e", stitchCount: 1000, isExtra1000Stitches: true, quantityTier, unitPrice: extra1000[index] },
  ]),
};
const whiteData: UkTradeReferenceData = { ...data, garments: [...data.garments, { ...data.garments[0], id: "white", colour: "Whites" }] };
const item = (overrides: Partial<UkTradeItemInput> = {}): UkTradeItemInput => ({ id: "i", garmentId: "g", quantity: 50, printPositions: [{ position: "FRONT", colourCount: 1 }], embroideryStitches: [null, null, null], ...overrides });

test("UK print matrix uses every floor quantity tier for one and ten colours", () => {
  for (const [index, quantity] of printTiers.entries()) {
    assert.equal(calculateUkTradeItem(item({ quantity }), data).printBreakdowns[0].unitPrice, printOneColour[index]);
    assert.equal(calculateUkTradeItem(item({ quantity, printPositions: [{ position: "FRONT", colourCount: 10 }] }), data).printBreakdowns[0].unitPrice, printTenColour[index]);
  }
});

test("UK embroidery matrix uses every quantity tier, stitch tiers, and rounded extra 1k pricing", () => {
  for (const [index, quantity] of embroideryTiers.entries()) {
    assert.equal(calculateUkTradeItem(item({ quantity, printPositions: [], embroideryStitches: [7000, null, null] }), data).embroideryBreakdowns[0].unitPrice, embroidery7000[index]);
    assert.equal(calculateUkTradeItem(item({ quantity, printPositions: [], embroideryStitches: [15000, null, null] }), data).embroideryBreakdowns[0].unitPrice, embroidery15000[index]);
    assert.equal(calculateUkTradeItem(item({ quantity, printPositions: [], embroideryStitches: [15001, null, null] }), data).embroideryBreakdowns[0].unitPrice, embroidery15000[index] + extra1000[index]);
  }
  assert.equal(calculateUkTradeItem(item({ printPositions: [], embroideryStitches: [7500, null, null] }), data).embroideryBreakdowns[0].unitPrice, 2.37);
  assert.ok(Math.abs(calculateUkTradeItem(item({ printPositions: [], embroideryStitches: [16001, null, null] }), data).embroideryBreakdowns[0].unitPrice - 4.35) < 1e-9);
});

test("UK trade separates all setup from unit and quantity pricing while reconciling the final total", () => {
  const result = calculateUkTradeItem(item({ printPositions: [{ position: "FRONT", colourCount: 1 }, { position: "BACK", colourCount: 1 }], embroideryStitches: [7000, null, null] }), data);
  assert.equal(result.unitPriceExVatExcludingSetup, 7.09);
  assert.equal(result.quantitySubtotalExVatExcludingSetup, 354.5);
  assert.equal(result.quantityTotalIncVatExcludingSetup, 425.4);
  assert.equal(result.screenCount, 4);
  assert.equal(result.screenSetupUnitExVat, 20);
  assert.equal(result.screenSetupSubtotalExVat, 80);
  assert.equal(result.embroiderySetupCount, 1);
  assert.equal(result.embroiderySetupUnitExVat, 30);
  assert.equal(result.embroiderySetupSubtotalExVat, 30);
  assert.equal(result.totalSetupExVat, 110);
  assert.equal(result.itemSubtotalExVat, 464.5);
  assert.equal(result.itemVat, 92.9);
  assert.equal(result.itemTotalIncVat, 557.4);
});

test("UK acceptance values keep four-screen setup out of the £4.90 unit and £294 quantity total", () => {
  const acceptanceData = { ...data, printTiers: data.printTiers.map((tier) => tier.positionCode === "STANDARD" && tier.quantityTier === 50 && tier.colourCount === 1 ? { ...tier, unitPrice: 1.45 } : tier) };
  const result = calculateUkTradeItem(item({ printPositions: [{ position: "FRONT", colourCount: 1 }, { position: "BACK", colourCount: 1 }] }), acceptanceData);
  assert.equal(result.unitPriceExVatExcludingSetup, 4.90);
  assert.equal(result.quantitySubtotalExVatExcludingSetup, 245);
  assert.equal(result.quantityTotalIncVatExcludingSetup, 294);
  assert.equal(result.screenSetupSubtotalExVat, 80);
  assert.equal(result.screenSetupTotalIncVat, 96);
  assert.equal(result.itemTotalIncVat, 390);
});

test("UK print underbase and neck rules charge the approved calculated screens", () => {
  const front = calculateUkTradeItem(item(), data);
  assert.equal(front.screenCount, 2);
  assert.equal(front.screenSetupSubtotalExVat, 40);
  const neck = calculateUkTradeItem(item({ printPositions: [{ position: "NECK_PRINT_STANDARD" }] }), data);
  assert.equal(neck.printCost, 44.5);
  assert.equal(neck.screenCount, 2);
  const transfer = calculateUkTradeItem(item({ printPositions: [{ position: "NECK_PRINT_TRANSFER" }] }), data);
  assert.equal(transfer.printCost, 67);
  assert.equal(transfer.screenCount, 0);
  assert.equal(transfer.screenSetupSubtotalExVat, 0);
});

test("UK coloured garments add one underbase per standard print position", () => {
  assert.equal(calculateUkTradeItem(item(), data).screenCount, 2);
  assert.equal(calculateUkTradeItem(item({ printPositions: [{ position: "FRONT", colourCount: 1 }, { position: "BACK", colourCount: 1 }] }), data).screenCount, 4);
  assert.equal(calculateUkTradeItem(item({ printPositions: [{ position: "FRONT", colourCount: 10 }] }), data).screenCount, 11);
});

test("UK white and Whites garments do not add standard underbase screens", () => {
  assert.equal(calculateUkTradeItem(item({ garmentId: "white" }), whiteData).screenCount, 1);
  assert.equal(calculateUkTradeItem(item({ garmentId: "white", printPositions: [{ position: "FRONT", colourCount: 1 }, { position: "BACK", colourCount: 1 }] }), whiteData).screenCount, 2);
  assert.equal(calculateUkTradeItem(item({ garmentId: "white", printPositions: [{ position: "FRONT", colourCount: 10 }] }), whiteData).screenCount, 10);
  const lowerCaseWhite = { ...whiteData, garments: whiteData.garments.map((garment) => garment.id === "white" ? { ...garment, colour: "white" } : garment) };
  assert.equal(calculateUkTradeItem(item({ garmentId: "white" }), lowerCaseWhite).screenCount, 1);
});

test("UK empty colour counts are invalid and never treated as one colour", () => {
  const result = calculateUkTradeItem(item({ printPositions: [{ position: "FRONT" }] }), data);
  assert.equal(result.screenCount, 0);
  assert.equal(result.errors.some((error) => error.code === "INVALID_PRINT_COLOUR_COUNT"), true);
});

test("UK neck prices use the PDF 50-99 and 100+ rules", () => {
  assert.equal(calculateUkTradeItem(item({ printPositions: [{ position: "NECK_PRINT_STANDARD" }] }), data).printBreakdowns[0].unitPrice, .89);
  assert.equal(calculateUkTradeItem(item({ quantity: 100, printPositions: [{ position: "NECK_PRINT_STANDARD" }] }), data).printBreakdowns[0].unitPrice, .60);
  assert.equal(calculateUkTradeItem(item({ printPositions: [{ position: "NECK_PRINT_TRANSFER" }] }), data).printBreakdowns[0].unitPrice, 1.34);
  assert.equal(calculateUkTradeItem(item({ quantity: 100, printPositions: [{ position: "NECK_PRINT_TRANSFER" }] }), data).printBreakdowns[0].unitPrice, .90);
});

test("UK copied quote has separate setup lines with exact singular and plural wording", () => {
  const decorated = item({ itemLabel: "Tour Shirt", printPositions: [{ position: "FRONT", colourCount: 1 }, { position: "BACK", colourCount: 1 }], embroideryStitches: [7000, null, null] });
  const quote = formatUkTradeQuote([decorated], [calculateUkTradeItem(decorated, data)], data.garments);
  assert.match(quote, /50 x £7\.09 \+ VAT each \(£425\.40 inc VAT\)/);
  assert.match(quote, /4 x screens @ £20\.00 \+ VAT each \/ £96\.00 total inc VAT/);
  assert.match(quote, /1 x embroidery setup @ £30\.00 \+ VAT \/ £36\.00 total inc VAT/);
  const embroideryOnly = item({ printPositions: [], embroideryStitches: [7000, null, null] });
  assert.doesNotMatch(formatUkTradeQuote([embroideryOnly], [calculateUkTradeItem(embroideryOnly, data)], data.garments), /screen/);
  const singular = { ...calculateUkTradeItem(item(), data), screenCount: 1, screenSetupSubtotalExVat: 20, screenSetupTotalIncVat: 24 };
  assert.match(formatUkTradeQuote([item()], [singular], data.garments), /1 x screen @ £20\.00/);
});

test("UK copied white-garment quote uses the corrected screen setup total", () => {
  const decorated = item({ garmentId: "white", itemLabel: "White Shirt", printPositions: [{ position: "FRONT", colourCount: 1 }, { position: "BACK", colourCount: 1 }] });
  const quote = formatUkTradeQuote([decorated], [calculateUkTradeItem(decorated, whiteData)], whiteData.garments);
  assert.match(quote, /2 x screens @ £20\.00 \+ VAT each \/ £48\.00 total inc VAT/);
});

test("UK invalid items do not produce copied output", () => {
  const invalid = calculateUkTradeItem(item({ garmentId: null }), data);
  assert.equal(invalid.errors[0].message, "Select garment.");
  assert.equal(formatUkTradeQuote([item()], [invalid], data.garments), "");
});
