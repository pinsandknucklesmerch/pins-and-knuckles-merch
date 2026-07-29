import type { EuQuoteLine } from "./euQuoteFormatter.ts";
import type { EuCalculatorTotals, UkTradeItemInput, UkTradeItemResult } from "./types.ts";

export function buildEuBreakdown(lines: EuQuoteLine[], totals: EuCalculatorTotals) {
  return {
    productionItems: lines.map(({ result }) => ({
      baseUnitPrice: result.baseCost / result.quantity,
      unitCost: result.productionSubtotalExVat / result.quantity,
      subtotal: result.productionSubtotalExVat,
      digitising: result.digitisingProductionCost,
    })),
    pinsItems: lines.map(({ result }) => ({
      baseUnitPrice: result.baseCost / result.quantity,
      garmentMarkupUnitPrice: result.garmentMarkupCost / result.quantity,
      pkMarkupUnitPrice: result.pkMarkupCost / result.quantity,
      unitCost: result.customerSubtotalExVat / result.quantity,
      subtotal: result.customerSubtotalExVat,
      digitisingInclVat: result.digitisingCustomerCost * (1 + totals.vatRate / 100),
    })),
    totals,
  };
}

export function buildUkTradeBreakdown(items: UkTradeItemInput[], results: UkTradeItemResult[], screenSetupUnitPrice: number) {
  const validItems = results.flatMap((result, index) => result.errors.length === 0 && items[index] ? [{ input: items[index], result }] : []);
  const total = validItems.reduce((sum, { result }) => sum + result.totalCost, 0);
  const garmentCost = validItems.reduce((sum, { result }) => sum + result.garmentCost, 0);
  const printCost = validItems.reduce((sum, { result }) => sum + result.printCost, 0);
  const screenSetupCount = validItems.reduce((sum, { result }) => sum + result.screenSetupCount, 0);
  const screenSetupCost = validItems.reduce((sum, { result }) => sum + result.screenSetupCost, 0);
  const embroideryCost = validItems.reduce((sum, { result }) => sum + result.embroideryCost, 0);
  const embroiderySetupCost = validItems.reduce((sum, { result }) => sum + result.embroiderySetupCost, 0);
  const quantity = validItems.reduce((sum, { result }) => sum + result.quantity, 0);
  return { validItems, total, garmentCost, printCost, screenSetupCount, screenSetupCost, screenSetupUnitPrice, embroideryCost, embroiderySetupCost, quantity, unitCost: quantity > 0 ? total / quantity : 0 };
}
