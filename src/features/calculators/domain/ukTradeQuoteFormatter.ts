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
      `${item.quantity} x ${currency.format(result.totalCost / item.quantity)} each (${currency.format(result.totalCost)} ex vat)`,
    ].join("\n");
  }).filter((entry): entry is string => Boolean(entry)).join("\n\n");
}
