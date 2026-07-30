"use client";

import { Check, Copy } from "lucide-react";
import { Panel } from "@/components/ui/Panel";
import { CopyableCard } from "@/components/ui/CopyableCard";
import { buildEuBreakdown } from "../domain/calculatorBreakdowns.ts";
import { formatEuStandardQuote, getEuItemLabel, type EuQuoteLine } from "../domain/euQuoteFormatter.ts";
import type { EuCalculatorTotals } from "../domain/types.ts";

type EuCalculatorResultsProps = {
  items: EuQuoteLine[];
  totals: EuCalculatorTotals;
  showSummary?: boolean;
  showBreakdown?: boolean;
  showEmptyState?: boolean;
  quoteFormatter?: (items: EuQuoteLine[], totals: EuCalculatorTotals) => string;
};

const currencyFormatter = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "EUR",
});

function money(value: number) {
  return currencyFormatter.format(value);
}

function printLabel(position: string, colourCount: number | null) {
  const label = position.replaceAll("_", " ").toLowerCase().replace(/^\w/, (letter) => letter.toUpperCase());
  return colourCount ? `${label} · ${colourCount} colour${colourCount === 1 ? "" : "s"}` : label;
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border/60 py-2 last:border-0">
      <dt className="min-w-0 text-muted-foreground">{label}</dt>
      <dd className="shrink-0 whitespace-nowrap text-right font-medium tabular-nums text-foreground">{value}</dd>
    </div>
  );
}

function ItemHeading({ line, index }: { line: EuQuoteLine; index: number }) {
  return (
    <div className="mb-2 flex min-w-0 items-baseline justify-between gap-3">
      <h3 className="min-w-0 truncate text-sm font-semibold text-foreground" title={`${getEuItemLabel(line.input.itemLabel, index)} · ${line.garment.name}`}>
        {getEuItemLabel(line.input.itemLabel, index)} · {line.garment.name}
      </h3>
      <span className="shrink-0 text-xs tabular-nums text-muted-foreground">× {line.result.quantity}</span>
    </div>
  );
}

function ProductionBreakdown({ line, index, breakdown }: { line: EuQuoteLine; index: number; breakdown: ReturnType<typeof buildEuBreakdown>["productionItems"][number] }) {
  const { result } = line;
  return (
    <div className="min-w-0 rounded-md border border-border/70 bg-background/55 p-3 backdrop-blur-sm">
      <ItemHeading line={line} index={index} />
      <dl className="text-xs">
        <DetailRow label="Garment base price / unit" value={money(breakdown.baseUnitPrice)} />
        {result.printBreakdowns.map((print) => (
          <DetailRow key={`production-${print.position}`} label={printLabel(print.position, print.colourCount)} value={`${money(print.productionUnitPrice)} / unit`} />
        ))}
        {result.embroideryBreakdowns.map((embroidery) => (
          <DetailRow key={`production-${embroidery.size}`} label={`${embroidery.size} embroidery`} value={`${money(embroidery.productionUnitPrice)} / unit`} />
        ))}
        {result.digitisingProductionCost > 0 ? <DetailRow label="Digitising production cost" value={money(breakdown.digitising)} /> : null}
        <DetailRow label="Production unit cost excl. VAT" value={money(breakdown.unitCost)} />
        <DetailRow label="Production item subtotal excl. VAT" value={money(breakdown.subtotal)} />
      </dl>
    </div>
  );
}

function PinsBreakdown({ line, index, breakdown }: { line: EuQuoteLine; index: number; breakdown: ReturnType<typeof buildEuBreakdown>["pinsItems"][number] }) {
  const { input, result } = line;
  return (
    <div className="min-w-0 rounded-md border border-border/70 bg-background/55 p-3 backdrop-blur-sm">
      <ItemHeading line={line} index={index} />
      <dl className="text-xs">
        <DetailRow label="Garment base price / unit" value={money(breakdown.baseUnitPrice)} />
        <DetailRow label="Garment markup / unit" value={money(breakdown.garmentMarkupUnitPrice)} />
        {input.pkMarkupEnabled && breakdown.pkMarkupUnitPrice !== 0 ? <DetailRow label="PK markup / unit" value={money(breakdown.pkMarkupUnitPrice)} /> : null}
        {result.printBreakdowns.map((print) => (
          <DetailRow key={`customer-${print.position}`} label={printLabel(print.position, print.colourCount)} value={`${money(print.customerUnitPrice)} / unit`} />
        ))}
        {result.embroideryBreakdowns.map((embroidery) => (
          <DetailRow key={`customer-${embroidery.size}`} label={`${embroidery.size} embroidery`} value={`${money(embroidery.customerUnitPrice)} / unit`} />
        ))}
        {result.digitisingCustomerCost > 0 ? <DetailRow label="Digitising fee incl. VAT" value={money(breakdown.digitisingInclVat)} /> : null}
        <DetailRow label="Total unit cost excl. VAT" value={money(breakdown.unitCost)} />
        <DetailRow label="Pins item subtotal excl. VAT" value={money(breakdown.subtotal)} />
      </dl>
    </div>
  );
}

export function EuCalculatorResults({
  items,
  totals,
  showSummary = true,
  showBreakdown = true,
  showEmptyState = true,
  quoteFormatter = formatEuStandardQuote,
}: EuCalculatorResultsProps) {
  const breakdown = buildEuBreakdown(items, totals);

  if (items.length === 0) {
    return showEmptyState ? <div className="rounded-md border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">No valid items</div> : null;
  }

  return (
    <div className="grid min-w-0 content-start gap-4">
      {showSummary ? <div className="grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
        <Panel className="border-border/90 bg-card p-4">
          <div className="text-xs font-medium text-muted-foreground">Production Costs</div>
          <div className="mt-2 text-2xl font-semibold tabular-nums text-foreground">{money(totals.productionSubtotalExVat)}</div>
          <div className="mt-1 text-xs text-muted-foreground">Excl. VAT</div>
        </Panel>
        <CopyableCard
          value={quoteFormatter(items, totals)}
          aria-label="Copy Pins Price quote"
          actionLabel="Copy Pins Price quote"
          className="border-accent/60 bg-accent/10 hover:bg-accent/15"
        >
          {(copyState) => <><div className="flex items-center justify-between gap-3">
            <div className="text-xs font-medium text-accent">Pins Price (incl VAT)</div>
            {copyState === "copied" ? <Check className="size-4 text-accent" aria-hidden="true" /> : <Copy className="size-4 text-accent" aria-hidden="true" />}
          </div>
          <div className="mt-2 text-2xl font-semibold tabular-nums text-foreground">{money(totals.customerTotalIncVat)}</div>
          <div className="mt-1 text-xs text-muted-foreground" aria-live="polite">
            {copyState === "copied" ? "Copied" : copyState === "error" ? "Copy unavailable" : "Click to copy"}
          </div>
          </>}
        </CopyableCard>
      </div> : null}

      {showBreakdown ? <details open className="group min-w-0 rounded-lg border border-border/90 bg-card/75 backdrop-blur-sm">
        <summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden">
          <span className="flex items-center justify-between gap-3">Breakdown <span className="text-muted-foreground transition-transform group-open:rotate-180">⌄</span></span>
        </summary>
        <div className="grid gap-4 border-t border-border p-4">
          <div className="grid min-w-0 gap-4 xl:grid-cols-2">
            <div className="grid min-w-0 content-start gap-3">
              <h2 className="text-sm font-semibold text-foreground">Production Cost Breakdown</h2>
              {items.map((line, index) => <ProductionBreakdown key={line.result.itemId} line={line} index={index} breakdown={breakdown.productionItems[index]} />)}
            </div>
            <div className="grid min-w-0 content-start gap-3">
              <h2 className="text-sm font-semibold text-foreground">Pins Price Breakdown</h2>
              {items.map((line, index) => <PinsBreakdown key={line.result.itemId} line={line} index={index} breakdown={breakdown.pinsItems[index]} />)}
            </div>
          </div>
          <div className="border-t border-border pt-3">
            <dl className="text-sm">
              <DetailRow label="Production subtotal excl. VAT" value={money(totals.productionSubtotalExVat)} />
              <DetailRow label="Pins subtotal excl. VAT" value={money(totals.customerSubtotalExVat)} />
              <DetailRow label="VAT" value={money(totals.vatAmount)} />
              <DetailRow label="Total incl. VAT" value={money(totals.customerTotalIncVat)} />
              <DetailRow label="Profit excl. VAT" value={money(totals.profitExVat)} />
            </dl>
          </div>
        </div>
      </details> : null}
    </div>
  );
}
