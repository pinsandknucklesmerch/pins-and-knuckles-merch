import type { CalculatorValidationError, UkTradeItemInput, UkTradeItemResult, UkTradePrintPosition, UkTradeReferenceData } from "./types.ts";

const printTiers = [50, 100, 200, 500, 1000, 2500, 5000, 10000];
const embroideryTiers = [50, 100, 200, 500, 1000, 2500];
const floorTier = (quantity: number, tiers: number[]) => [...tiers].reverse().find((tier) => quantity >= tier) ?? null;
const setupFee = (data: UkTradeReferenceData, code: "UK_SCREEN_SETUP" | "UK_EMBROIDERY_SETUP") => data.fees.find((fee) => fee.feeCode === code && fee.costSide === "trade")?.amount;
const isNeck = (position: UkTradePrintPosition) => position.startsWith("NECK_");

export function calculateUkTradeItem(input: UkTradeItemInput, data: UkTradeReferenceData): UkTradeItemResult {
  const errors: CalculatorValidationError[] = [];
  const garment = input.garmentId ? data.garments.find((candidate) => candidate.id === input.garmentId) : undefined;
  if (!garment) errors.push({ code: "MISSING_GARMENT", itemId: input.id, message: "Select garment." });
  if (garment?.gbpPrice === null) errors.push({ code: "MISSING_GARMENT_PRICE", itemId: input.id, message: "Missing GBP garment price." });
  if (input.quantity < 50) errors.push({ code: "INVALID_QUANTITY", itemId: input.id, message: "Minimum quantity 50." });
  if (input.printPositions.length === 0 && input.embroideryStitches.every((value) => value === null)) errors.push({ code: "MISSING_PRINT_TIER", itemId: input.id, message: "Select at least one print position or embroidery item." });
  const printTier = floorTier(input.quantity, printTiers);
  const embroideryTier = floorTier(input.quantity, embroideryTiers);
  const screenSetup = setupFee(data, "UK_SCREEN_SETUP");
  const embroiderySetup = setupFee(data, "UK_EMBROIDERY_SETUP");
  if (screenSetup === undefined) errors.push({ code: "MISSING_FEE", message: "Missing UK screen setup fee." });
  if (embroiderySetup === undefined) errors.push({ code: "MISSING_FEE", message: "Missing UK embroidery setup fee." });
  let printCost = 0, screens = 0;
  const printBreakdowns = [];
  for (const selection of input.printPositions) {
    const colourCount = selection.position === "NECK_PRINT_STANDARD" ? 1 : selection.position === "NECK_PRINT_TRANSFER" ? null : selection.colourCount;
    const positionCode = isNeck(selection.position) ? selection.position : "STANDARD";
    const tier = printTier === null ? undefined : data.printTiers.find((row) => row.positionCode === positionCode && row.colourCount === colourCount && row.quantityTier === printTier);
    if (!tier) { errors.push({ code: "MISSING_PRINT_TIER", itemId: input.id, message: `Missing price for ${selection.position.replaceAll("_", " ").toLowerCase()}.` }); continue; }
    const screenSetupCount = tier.setupScreenCountStrategy === "colour_count" ? (colourCount ?? 0) + 1 : tier.setupScreenCountStrategy === "one" ? 2 : 0;
    const cost = tier.unitPrice * input.quantity;
    printCost += cost;
    screens += screenSetupCount;
    printBreakdowns.push({ position: selection.position, colourCount: colourCount ?? null, unitPrice: tier.unitPrice, cost, screenSetupCount });
  }
  let embroideryCost = 0, embroiderySetupCost = 0;
  const embroideryBreakdowns = [];
  for (const stitches of input.embroideryStitches.filter((value): value is number => value !== null)) {
    const normal = Math.max(7000, Math.ceil(stitches)); const base = Math.min(15000, Math.ceil(normal / 1000) * 1000); const extra = normal > 15000 ? Math.ceil((normal - 15000) / 1000) : 0;
    const basePrice = embroideryTier === null ? undefined : data.embroideryTiers.find((row) => !row.isExtra1000Stitches && row.stitchCount === base && row.quantityTier === embroideryTier)?.unitPrice;
    const extraPrice = embroideryTier === null ? undefined : data.embroideryTiers.find((row) => row.isExtra1000Stitches && row.quantityTier === embroideryTier)?.unitPrice;
    if (basePrice === undefined || (extra > 0 && extraPrice === undefined)) { errors.push({ code: "MISSING_EMBROIDERY_PRICE", itemId: input.id, message: "Missing embroidery price." }); continue; }
    const unitPrice = basePrice + extra * (extraPrice ?? 0);
    const cost = unitPrice * input.quantity;
    const setupCost = embroiderySetup ?? 0;
    embroideryCost += cost; embroiderySetupCost += setupCost;
    embroideryBreakdowns.push({ stitches, unitPrice, cost, setupCost });
  }
  const garmentCost = garment?.gbpPrice != null ? garment.gbpPrice * input.quantity : 0;
  const screenSetupCost = screens * (screenSetup ?? 0); const totalCost = garmentCost + printCost + screenSetupCost + embroideryCost + embroiderySetupCost;
  return { itemId: input.id, garmentId: garment?.id ?? "", quantity: input.quantity, garmentCost, printCost, screenSetupCount: screens, screenSetupCost, embroideryCost, embroiderySetupCost, totalCost, printBreakdowns, embroideryBreakdowns, errors };
}
