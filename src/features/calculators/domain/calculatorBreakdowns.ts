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

export function buildUkTradeBreakdown(items: UkTradeItemInput[], results: UkTradeItemResult[]) {
  const validItems = results.flatMap((result, index) => result.errors.length === 0 && items[index] ? [{ input: items[index], result }] : []);
  const itemSubtotalExVat = validItems.reduce((sum, { result }) => sum + result.itemSubtotalExVat, 0);
  const totalIncVat = validItems.reduce((sum, { result }) => sum + result.itemTotalIncVat, 0);
  const quantitySubtotalExVatExcludingSetup = validItems.reduce((sum, { result }) => sum + result.quantitySubtotalExVatExcludingSetup, 0);
  const quantityTotalIncVatExcludingSetup = validItems.reduce((sum, { result }) => sum + result.quantityTotalIncVatExcludingSetup, 0);
  const garmentCost = validItems.reduce((sum, { result }) => sum + result.garmentCost, 0);
  const printCost = validItems.reduce((sum, { result }) => sum + result.printCost, 0);
  const screenCount = validItems.reduce((sum, { result }) => sum + result.screenCount, 0);
  const screenSetupSubtotalExVat = validItems.reduce((sum, { result }) => sum + result.screenSetupSubtotalExVat, 0);
  const embroideryCost = validItems.reduce((sum, { result }) => sum + result.embroideryCost, 0);
  const embroiderySetupSubtotalExVat = validItems.reduce((sum, { result }) => sum + result.embroiderySetupSubtotalExVat, 0);
  const totalSetupExVat = validItems.reduce((sum, { result }) => sum + result.totalSetupExVat, 0);
  const totalSetupIncVat = validItems.reduce((sum, { result }) => sum + result.totalSetupIncVat, 0);
  const vatAmount = validItems.reduce((sum, { result }) => sum + result.itemVat, 0);
  const quantity = validItems.reduce((sum, { result }) => sum + result.quantity, 0);
  return { validItems, itemSubtotalExVat, totalIncVat, quantitySubtotalExVatExcludingSetup, quantityTotalIncVatExcludingSetup, garmentCost, printCost, screenCount, screenSetupSubtotalExVat, screenSetupTotalIncVat: validItems.reduce((sum, { result }) => sum + result.screenSetupTotalIncVat, 0), embroideryCost, embroiderySetupSubtotalExVat, embroiderySetupTotalIncVat: validItems.reduce((sum, { result }) => sum + result.embroiderySetupTotalIncVat, 0), totalSetupExVat, totalSetupIncVat, vatAmount, quantity, unitCost: quantity > 0 ? quantitySubtotalExVatExcludingSetup / quantity : 0 };
}
