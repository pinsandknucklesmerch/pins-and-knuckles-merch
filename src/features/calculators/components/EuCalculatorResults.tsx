"use client";

import { Check, Copy } from "lucide-react";
import { Panel } from "@/components/ui/Panel";
import { CopyableCard } from "@/components/ui/CopyableCard";
import { CollapsibleSurface, Surface } from "@/components/ui/Surface";
import { buildEuBreakdown } from "../domain/calculatorBreakdowns.ts";
import { formatEuStandardQuote, getEuItemLabel, type EuQuoteLine } from "../domain/euQuoteFormatter.ts";
import type { EuCalculatorTotals } from "../domain/types.ts";
import { buildAlignedEuBreakdownRows, type AlignedEuBreakdownRow } from "../lib/euBreakdownRows.ts";

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

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-start gap-3 border-b border-border/60 py-2 last:border-0">
      <dt className="min-w-0 text-muted-foreground">{label}</dt>
      <dd className="min-w-0 whitespace-nowrap text-right font-medium tabular-nums text-foreground">{value}</dd>
    </div>
  );
}

function ItemHeading({ line, index }: { line: EuQuoteLine; index: number }) {
  return (
    <div className="mb-2 flex min-w-0 items-baseline justify-between gap-3">
      <h3 className="min-w-0 break-words text-sm font-semibold text-foreground" title={`${getEuItemLabel(line.input.itemLabel, index)} · ${line.garment.name}`}>
        {getEuItemLabel(line.input.itemLabel, index)} · {line.garment.name}
      </h3>
      <span className="shrink-0 text-xs tabular-nums text-muted-foreground">× {line.result.quantity}</span>
    </div>
  );
}

function AlignedBreakdownCell({ cell }: { cell?: AlignedEuBreakdownRow["production"] }) {
  return <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-start gap-3 border-b border-border/60 py-2 text-xs last:border-0">
    {cell ? <><span className="min-w-0 text-muted-foreground">{cell.label}</span><span className="min-w-0 whitespace-nowrap text-right font-medium tabular-nums text-foreground">{money(cell.amount)}{cell.perUnit ? " / unit" : ""}</span></> : null}
  </div>;
}

function MobileBreakdownSection({ title, rows, side }: { title: string; rows: AlignedEuBreakdownRow[]; side: "production" | "pins" }) {
  return <section className="min-w-0"><h3 className="mb-2 text-xs font-semibold text-muted-foreground">{title}</h3><div>{rows.map((row) => row[side] ? <AlignedBreakdownCell key={row.key} cell={row[side]} /> : null)}</div></section>;
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
      {showSummary ? <div className="grid min-w-0 gap-3 sm:grid-cols-2">
        <Panel className="border-border/90 bg-card p-4">
          <div className="text-xs font-medium text-muted-foreground">Production Costs</div>
          <div className="mt-2 whitespace-nowrap text-2xl font-semibold tabular-nums text-foreground">{money(totals.productionSubtotalExVat)}</div>
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
          <div className="mt-2 whitespace-nowrap text-2xl font-semibold tabular-nums text-foreground">{money(totals.customerTotalIncVat)}</div>
          <div className="mt-1 text-xs text-muted-foreground">Click to copy</div>
          </>}
        </CopyableCard>
      </div> : null}

      {showBreakdown ? <CollapsibleSurface open className="min-w-0" summary={<span className="flex items-center justify-between gap-3">Breakdown <span className="text-muted-foreground transition-transform group-open:rotate-180">⌄</span></span>}>
        <div className="grid gap-4">
          <div className="grid min-w-0 gap-3">
            <div className="grid min-w-0 gap-3 md:grid-cols-2">
              <h2 className="text-sm font-semibold text-foreground">Production Cost Breakdown</h2>
              <h2 className="text-sm font-semibold text-foreground">Pins Price Breakdown</h2>
            </div>
            {items.map((line, index) => {
              const rows = buildAlignedEuBreakdownRows(line, breakdown.productionItems[index], breakdown.pinsItems[index]);
              return <Surface key={line.result.itemId} variant="compact" className="min-w-0 bg-background/55">
                <ItemHeading line={line} index={index} />
                <div className="grid min-w-0 gap-4 md:hidden"><MobileBreakdownSection title="Production Cost" rows={rows} side="production" /><MobileBreakdownSection title="Pins Price" rows={rows} side="pins" /></div>
                <div className="hidden min-w-0 md:block"><div className="grid min-w-0 grid-cols-2 gap-4"><h3 className="text-xs font-semibold text-muted-foreground">Production Cost</h3><h3 className="text-xs font-semibold text-muted-foreground">Pins Price</h3>{rows.map((row) => <div key={row.key} className="col-span-2 grid min-w-0 grid-cols-2 gap-4"><AlignedBreakdownCell cell={row.production} /><AlignedBreakdownCell cell={row.pins} /></div>)}</div></div>
              </Surface>;
            })}
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
      </CollapsibleSurface> : null}
    </div>
  );
}
