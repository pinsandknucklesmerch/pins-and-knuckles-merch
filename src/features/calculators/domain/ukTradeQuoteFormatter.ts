import { getEuItemLabel } from "./euQuoteFormatter.ts";
import type { Garment, UkTradeItemInput, UkTradeItemResult } from "./types.ts";

const currency = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" });
const labels: Record<UkTradeItemInput["printPositions"][number]["position"], string> = { FRONT: "Front", BACK: "Back", LEFT_SLEEVE: "Left Sleeve", RIGHT_SLEEVE: "Right Sleeve", NECK_PRINT_STANDARD: "Neck Print Standard", NECK_PRINT_TRANSFER: "Neck Print Transfer" };

export function formatUkTradeQuote(items: UkTradeItemInput[], results: UkTradeItemResult[], garments: Garment[]) {
  return results.map((result, index) => {
    if (result.errors.length > 0) return null;
    const item = items[index]; const garment = garments.find((candidate) => candidate.id === item?.garmentId);
    if (!item || !garment) return null;
    const printSummary = item.printPositions.map((selection) => selection.position.startsWith("NECK_") ? labels[selection.position] : `${selection.colourCount} Col ${labels[selection.position]}`);
    const embroiderySummary = item.embroideryStitches.filter((value): value is number => value !== null).map((value) => `Embroidery ${value.toLocaleString()} stitches`);
    const work = [...printSummary, ...embroiderySummary].join(", ");
    return [
      `${getEuItemLabel(item.itemLabel, index)}:`,
      "",
      `${[garment.code, garment.brandName, garment.name, garment.colour].filter(Boolean).join(" ")}${work ? ` (${work})` : ""}`,
      `${item.quantity} x ${currency.format(result.unitPriceExVatExcludingSetup)} + VAT each (${currency.format(result.quantityTotalIncVatExcludingSetup)} inc VAT)`,
      ...(result.screenCount > 0
        ? [`${result.screenCount} x ${result.screenCount === 1 ? "screen" : "screens"} @ ${currency.format(result.screenSetupUnitExVat)} + VAT each / ${currency.format(result.screenSetupTotalIncVat)} total inc VAT`]
        : []),
      ...(result.embroiderySetupCount > 0
        ? [`${result.embroiderySetupCount} x embroidery setup @ ${currency.format(result.embroiderySetupUnitExVat)} + VAT / ${currency.format(result.embroiderySetupTotalIncVat)} total inc VAT`]
        : []),
    ].join("\n");
  }).filter((entry): entry is string => Boolean(entry)).join("\n\n");
}
