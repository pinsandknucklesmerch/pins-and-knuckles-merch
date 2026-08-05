import { getEuItemLabel } from "../domain/euQuoteFormatter.ts";
import { buildUkTradeBreakdown } from "../domain/calculatorBreakdowns.ts";
import type { UkTradeItemInput, UkTradeItemResult } from "../domain/types.ts";

const money = (value: number) => new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(value);
const printLabel = (position: string, colours: number | null) => position === "NECK_PRINT_STANDARD" ? "Neck print" : position === "NECK_PRINT_TRANSFER" ? "Neck transfer" : `${position.replaceAll("_", " ").toLowerCase().replace(/^\w/, (value) => value.toUpperCase())} (${colours ?? 1} col)`;

function Row({ label, value, strong = false, valueClassName = "" }: { label: string; value: string; strong?: boolean; valueClassName?: string }) {
  return <div className={`flex items-start justify-between gap-3 py-1.5 text-sm ${strong ? "font-semibold text-foreground" : "text-muted-foreground"}`}><dt>{label}</dt><dd className={`shrink-0 text-right font-medium tabular-nums text-foreground ${valueClassName}`}>{value}</dd></div>;
}

export function UkTradeBreakdown({ items, results }: { items: UkTradeItemInput[]; results: UkTradeItemResult[] }) {
  const breakdown = buildUkTradeBreakdown(items, results);
  if (breakdown.validItems.length === 0) return null;

  return <details open className="group rounded-md border border-border/90 bg-background/35 text-sm">
    <summary className="cursor-pointer list-none px-4 py-3 font-semibold text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden"><span className="flex items-center justify-between">Breakdown <span className="text-muted-foreground transition-transform group-open:rotate-180">⌄</span></span></summary>
    <div className="grid gap-4 border-t border-border p-4">
      <dl><Row label="Quantity subtotal (excl. VAT)" value={money(breakdown.quantitySubtotalExVatExcludingSetup)} /><Row label="Setup (excl. VAT)" value={money(breakdown.totalSetupExVat)} /><Row label="VAT" value={money(breakdown.vatAmount)} /><Row label="Final total (inc. VAT)" value={money(breakdown.totalIncVat)} strong /></dl>
      <div className="border-t border-border pt-4"><h2 className="mb-3 text-sm font-semibold text-foreground">Item Breakdown</h2><div className="grid gap-3">{breakdown.validItems.map(({ input, result }) => <section key={result.itemId} className="rounded-md border border-border/70 bg-background/55 p-3"><div className="mb-2 flex items-baseline justify-between gap-3"><h3 className="min-w-0 truncate text-sm font-semibold text-foreground">{getEuItemLabel(input.itemLabel, items.indexOf(input))}</h3><span className="shrink-0 text-xs text-muted-foreground">× {result.quantity}</span></div><dl><Row label="Garment base price / unit" value={`${money(result.garmentCost / result.quantity)} / unit`} />{result.printBreakdowns.map((print) => <Row key={`${print.position}-${print.colourCount}`} label={printLabel(print.position, print.colourCount)} value={`${money(print.unitPrice)} / unit`} />)}{result.embroideryBreakdowns.map((embroidery) => <Row key={embroidery.stitches} label={`Embroidery ${embroidery.stitches.toLocaleString()} stitches`} value={`${money(embroidery.unitPrice)} / unit`} />)}<Row label="Unit price (excl. setup & VAT)" value={`${money(result.unitPriceExVatExcludingSetup)} / unit`} valueClassName="text-primary" /><Row label="Quantity subtotal (excl. VAT)" value={money(result.quantitySubtotalExVatExcludingSetup)} /><Row label="Quantity total (inc. VAT, excl. setup)" value={money(result.quantityTotalIncVatExcludingSetup)} />{result.screenCount > 0 ? <Row label="Screen setup (excl. VAT)" value={`${result.screenCount} × ${money(result.screenSetupUnitExVat)} = ${money(result.screenSetupSubtotalExVat)}`} /> : null}{result.embroiderySetupCount > 0 ? <Row label="Embroidery setup (excl. VAT)" value={`${result.embroiderySetupCount} × ${money(result.embroiderySetupUnitExVat)} = ${money(result.embroiderySetupSubtotalExVat)}`} /> : null}<Row label="VAT" value={money(result.itemVat)} /><Row label="Final item total (inc. VAT)" value={money(result.itemTotalIncVat)} strong /></dl></section>)}</div></div>
    </div>
  </details>;
}
