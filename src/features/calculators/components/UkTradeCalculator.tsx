"use client";

import { Copy, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Panel } from "@/components/ui/Panel";
import { copyText } from "@/components/ui/copyText";
import { calculateUkTradeItem } from "../domain/ukTradePricingEngine.ts";
import type { UkTradeItemInput, UkTradeReferenceData } from "../domain/types.ts";
import { formatUkTradeQuote } from "../domain/ukTradeQuoteFormatter.ts";
import { CalculatorErrors } from "./CalculatorErrors";
import { CalculatorToolbar } from "./CalculatorToolbar";
import { EditableItemHeading } from "./EditableItemHeading";
import { GarmentCombobox } from "./GarmentCombobox";
import { UkTradeBreakdown } from "./UkTradeBreakdown";
import { UkTradeDecorationControls } from "./UkTradeDecorationControls";

const emptyItem = (index: number): UkTradeItemInput => ({ id: `item-${index}`, itemLabel: "", garmentId: null, quantity: 50, printPositions: [{ position: "FRONT", colourCount: 1 }], embroideryStitches: [null, null, null] });
const money = (value: number) => new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(value);

export function UkTradeCalculator({ referenceData }: { referenceData: UkTradeReferenceData }) {
  const [items, setItems] = useState<UkTradeItemInput[]>([emptyItem(1)]);
  const [decorationAttempts, setDecorationAttempts] = useState<Record<string, boolean>>({});
  const results = useMemo(() => items.map((item) => calculateUkTradeItem(item, referenceData)), [items, referenceData]);
  const validResults = results.filter((result) => result.errors.length === 0);
  const totalsIncVat = validResults.reduce((sum, result) => sum + result.totalCostIncVat, 0);
  const garmentSubtotalExVat = validResults.reduce((sum, result) => sum + result.garmentSubtotalExVat, 0);
  const screenSetupCost = validResults.reduce((sum, result) => sum + result.screenSetupCost, 0);
  const vatAmount = validResults.reduce((sum, result) => sum + result.vatAmount, 0);
  const hasValidItems = validResults.length > 0;
  const screenSetupUnitPrice = referenceData.fees.find((fee) => fee.feeCode === "UK_SCREEN_SETUP" && fee.costSide === "trade")?.amount ?? 0;

  const update = (item: UkTradeItemInput) => setItems((current) => current.map((row) => row.id === item.id ? item : row));
  async function copyQuote() {
    const text = formatUkTradeQuote(items, results, referenceData.garments);
    if (text) await copyText(text);
  }
  const addItem = () => setItems((current) => [...current, emptyItem(current.length + 1)]);
  const reset = () => { setItems([emptyItem(1)]); setDecorationAttempts({}); };
  const removeItem = (itemId: string) => setItems((current) => current.length === 1 ? current : current.filter((item) => item.id !== itemId));

  return <div className="grid min-w-0 gap-4">
    <CalculatorToolbar validItemCount={validResults.length} totalItemCount={items.length} onAddItem={addItem} onReset={reset} />
    <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(19rem,0.85fr)]">
      <div className="grid min-w-0 content-start gap-4">
        {items.map((item, index) => {
          const itemErrors = results[index].errors.filter((error) => error.code !== "MISSING_GARMENT" || decorationAttempts[item.id]);
          return <Panel key={item.id} className="grid content-start gap-4 border-border/90 bg-card">
            <div className="flex items-center justify-between gap-3">
              <EditableItemHeading index={index} value={item.itemLabel ?? ""} onChange={(itemLabel) => update({ ...item, itemLabel })} onBlur={(itemLabel) => update({ ...item, itemLabel })} />
              <button type="button" disabled={items.length === 1} onClick={() => removeItem(item.id)} className="inline-flex size-8 shrink-0 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40" aria-label={`Remove item ${index + 1}`}><Trash2 className="size-4" /></button>
            </div>
            <div className="grid gap-4 md:grid-cols-[1fr_140px]">
              <GarmentCombobox garments={referenceData.garments} value={item.garmentId} onChange={(garmentId) => update({ ...item, garmentId })} />
              <label className="grid gap-2 text-xs font-medium text-muted-foreground">Quantity<input min={50} max={10000} type="number" value={item.quantity} onChange={(event) => update({ ...item, quantity: Number(event.target.value) })} className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-ring" /></label>
            </div>
            <UkTradeDecorationControls printPositions={item.printPositions} embroideryStitches={item.embroideryStitches} onPrintPositionsChange={(printPositions) => update({ ...item, printPositions })} onEmbroideryChange={(embroideryStitches) => update({ ...item, embroideryStitches })} onDecorationSelect={() => setDecorationAttempts((current) => ({ ...current, [item.id]: true }))} />
            <CalculatorErrors errors={itemErrors} />
          </Panel>;
        })}
      </div>
      {hasValidItems ? <div className="grid min-w-0 content-start gap-4 xl:row-span-2">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
          <Panel className="p-4"><div className="text-xs text-muted-foreground">Garment & production</div><div className="mt-2 text-2xl font-semibold tabular-nums">{money(garmentSubtotalExVat)}</div><div className="mt-1 text-xs text-muted-foreground">ex VAT</div></Panel>
          <Panel className="p-4"><div className="text-xs text-muted-foreground">Screen setup</div><div className="mt-2 text-2xl font-semibold tabular-nums">{money(screenSetupCost)}</div><div className="mt-1 text-xs text-muted-foreground">ex VAT</div></Panel>
          <Panel className="p-4"><div className="text-xs text-muted-foreground">VAT</div><div className="mt-2 text-2xl font-semibold tabular-nums">{money(vatAmount)}</div></Panel>
          <Panel className="p-4"><div className="text-xs text-muted-foreground">Final total</div><div className="mt-2 text-2xl font-semibold tabular-nums">{money(totalsIncVat)}</div><button type="button" onClick={() => void copyQuote()} className="mt-4 inline-flex items-center gap-2 text-sm text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><Copy className="size-4" />Copy quote</button></Panel>
        </div>
        <UkTradeBreakdown items={items} results={results} screenSetupUnitPrice={screenSetupUnitPrice} />
      </div> : null}
    </div>
  </div>;
}
