import type {
  EuCalculatorItemInput,
  EuCalculatorItemResult,
  EuCalculatorTotals,
  Garment,
} from "./types.ts";

export type EuQuoteLine = {
  input: EuCalculatorItemInput;
  result: EuCalculatorItemResult;
  garment: Garment;
};

export function getEuItemLabel(itemLabel: string | undefined, index: number) {
  const trimmedLabel = itemLabel?.trim();
  return trimmedLabel || `Item ${index + 1}`;
}

const currencyFormatter = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "EUR",
});

function money(value: number) {
  return currencyFormatter.format(value);
}

const positionLabels: Record<EuQuoteLine["result"]["printBreakdowns"][number]["position"], string> = {
  FRONT: "Front",
  BACK: "Back",
  LEFT_SLEEVE: "Left Sleeve",
  RIGHT_SLEEVE: "Right Sleeve",
  NECK: "Neck",
};

const embroideryLabels: Record<EuQuoteLine["result"]["embroideryBreakdowns"][number]["size"], string> = {
  small: "Small embroidery",
  medium: "Medium embroidery",
  large: "Large embroidery",
};

export function formatEuStandardQuote(lines: EuQuoteLine[], totals: EuCalculatorTotals) {
  return lines
    .map(({ input, result, garment }, index) => {
      const printSummary = result.printBreakdowns.map((print) => {
        const colourCount = print.colourCount ?? 1;
        return `${colourCount} Col ${positionLabels[print.position]}`;
      });
      const embroiderySummary = result.embroideryBreakdowns.map(
        (embroidery) => embroideryLabels[embroidery.size],
      );
      const decorationSummary = [...printSummary, ...embroiderySummary].join(", ");
      const garmentParts = [garment.code, garment.brandName, garment.name, garment.colour]
        .map((part) => part.trim())
        .filter(Boolean);
      const garmentSummary = garmentParts.length > 0 ? garmentParts.join(" ") : "No garment";
      const subtotalExclVat = result.customerSubtotalExVat;
      const unitExclVat = result.quantity > 0 ? subtotalExclVat / result.quantity : 0;
      const totalInclVat = subtotalExclVat * (1 + totals.vatRate / 100);
      const digitisingFeeInclVat = result.digitisingCustomerCost * (1 + totals.vatRate / 100);

      return [
        `${getEuItemLabel(input.itemLabel, index)}:`,
        `${garmentSummary}${decorationSummary ? ` (${decorationSummary})` : ""}`,
        ...(result.digitisingCustomerCost > 0
          ? [`Digitizing fee = ${money(digitisingFeeInclVat)} (incl. VAT)`]
          : []),
        `${result.quantity} x ${money(unitExclVat)} (excl vat) ea = ${money(totalInclVat)}`,
      ].join("\n\n");
    })
    .join("\n\n");
}
