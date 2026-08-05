import type { EuQuoteLine } from "../domain/euQuoteFormatter.ts";

type BreakdownCell = {
  label: string;
  amount: number;
  perUnit?: boolean;
};

type ProductionBreakdown = {
  baseUnitPrice: number;
  unitCost: number;
  subtotal: number;
  digitising: number;
};

type PinsBreakdown = {
  baseUnitPrice: number;
  garmentMarkupUnitPrice: number;
  pkMarkupUnitPrice: number;
  unitCost: number;
  subtotal: number;
  digitisingInclVat: number;
};

export type AlignedEuBreakdownRow = {
  key: string;
  production?: BreakdownCell;
  pins?: BreakdownCell;
};

function printLabel(position: string, colourCount: number | null) {
  const label = position.replaceAll("_", " ").toLowerCase().replace(/^\w/, (letter) => letter.toUpperCase());
  return colourCount ? `${label} · ${colourCount} colour${colourCount === 1 ? "" : "s"}` : label;
}

export function buildAlignedEuBreakdownRows(line: EuQuoteLine, production: ProductionBreakdown, pins: PinsBreakdown): AlignedEuBreakdownRow[] {
  const rows: AlignedEuBreakdownRow[] = [
    {
      key: "garment-base",
      production: { label: "Garment base price / unit", amount: production.baseUnitPrice },
      pins: { label: "Garment base price / unit", amount: pins.baseUnitPrice },
    },
    { key: "garment-markup", pins: { label: "Garment markup / unit", amount: pins.garmentMarkupUnitPrice } },
  ];

  if (line.input.pkMarkupEnabled && pins.pkMarkupUnitPrice !== 0) {
    rows.push({ key: "pk-markup", pins: { label: "PK markup / unit", amount: pins.pkMarkupUnitPrice } });
  }

  for (const print of line.result.printBreakdowns) {
    rows.push({
      key: `print-${print.position.toLowerCase()}`,
      production: { label: printLabel(print.position, print.colourCount), amount: print.productionUnitPrice, perUnit: true },
      pins: { label: printLabel(print.position, print.colourCount), amount: print.customerUnitPrice, perUnit: true },
    });
  }

  const embroideryCounts = new Map<string, number>();
  for (const embroidery of line.result.embroideryBreakdowns) {
    const occurrence = embroideryCounts.get(embroidery.size) ?? 0;
    embroideryCounts.set(embroidery.size, occurrence + 1);
    rows.push({
      key: `embroidery-${embroidery.size}-${occurrence + 1}`,
      production: { label: `${embroidery.size} embroidery`, amount: embroidery.productionUnitPrice, perUnit: true },
      pins: { label: `${embroidery.size} embroidery`, amount: embroidery.customerUnitPrice, perUnit: true },
    });
  }

  if (line.result.digitisingProductionCost > 0 || line.result.digitisingCustomerCost > 0) {
    rows.push({
      key: "digitising",
      production: line.result.digitisingProductionCost > 0 ? { label: "Digitising production cost", amount: production.digitising } : undefined,
      pins: line.result.digitisingCustomerCost > 0 ? { label: "Digitising fee incl. VAT", amount: pins.digitisingInclVat } : undefined,
    });
  }

  rows.push(
    {
      key: "unit-cost",
      production: { label: "Unit cost excl. VAT", amount: production.unitCost },
      pins: { label: "Unit cost excl. VAT", amount: pins.unitCost },
    },
    {
      key: "subtotal",
      production: { label: "Item subtotal excl. VAT", amount: production.subtotal },
      pins: { label: "Item subtotal excl. VAT", amount: pins.subtotal },
    },
  );

  return rows;
}
