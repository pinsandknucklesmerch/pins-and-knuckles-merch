"use client";

import { Check, Copy, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Panel } from "@/components/ui/Panel";
import { calculateUkTradeItem } from "../domain/ukTradePricingEngine.ts";
import type { UkTradeItemInput, UkTradePrintPosition, UkTradeReferenceData } from "../domain/types.ts";
import { formatUkTradeQuote } from "../domain/ukTradeQuoteFormatter.ts";
import { GarmentCombobox } from "./GarmentCombobox";
import { CalculatorErrors } from "./CalculatorErrors";
import { UkTradeBreakdown } from "./UkTradeBreakdown";
import { CalculatorToolbar } from "./CalculatorToolbar";
import { EditableItemHeading } from "./EditableItemHeading";
import { copyText } from "@/components/ui/copyText";

const positions: Array<{ value: UkTradePrintPosition; label: string }> = [{ value: "FRONT", label: "Front" }, { value: "BACK", label: "Back" }, { value: "LEFT_SLEEVE", label: "Left Sleeve" }, { value: "RIGHT_SLEEVE", label: "Right Sleeve" }, { value: "NECK_PRINT_STANDARD", label: "Neck Print Standard" }, { value: "NECK_PRINT_TRANSFER", label: "Neck Print Transfer" }];
const emptyItem = (index: number): UkTradeItemInput => ({ id: `item-${index}`, itemLabel: "", garmentId: null, quantity: 50, printPositions: [{ position: "FRONT", colourCount: 1 }], embroideryStitches: [null, null, null] });
const money = (value: number) => new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(value);

export function UkTradeCalculator({ referenceData }: { referenceData: UkTradeReferenceData }) {
  const [items, setItems] = useState<UkTradeItemInput[]>([emptyItem(1)]); const [copyState, setCopyState] = useState<"idle" | "copied" | "error">("idle");
  const results = useMemo(() => items.map((item) => calculateUkTradeItem(item, referenceData)), [items, referenceData]);
  const validResults = results.filter((result) => result.errors.length === 0);
  const totals = validResults.reduce((sum, result) => sum + result.totalCost, 0);
  const garmentCost = validResults.reduce((sum, result) => sum + result.garmentCost, 0);
  const hasValidItems = validResults.length > 0;
  const screenSetupUnitPrice = referenceData.fees.find((fee) => fee.feeCode === "UK_SCREEN_SETUP" && fee.costSide === "trade")?.amount ?? 0;
  const update = (item: UkTradeItemInput) => setItems((current) => current.map((row) => row.id === item.id ? item : row));
  async function copyQuote() {
    const text = formatUkTradeQuote(items, results, referenceData.garments);
    if (!text) return;
    try { await copyText(text); setCopyState("copied"); }
    catch { setCopyState("error"); }
    window.setTimeout(() => setCopyState("idle"), 2200);
  }
  const addItem = () => setItems((current) => [...current, emptyItem(current.length + 1)]);
  const reset = () => setItems([emptyItem(1)]);
  return <div className="grid min-w-0 gap-4">
    <CalculatorToolbar validItemCount={validResults.length} totalItemCount={items.length} onAddItem={addItem} onReset={reset} />
    <div className={hasValidItems ? "grid min-w-0 gap-4 xl:grid-cols-[minmax(0,2.3fr)_minmax(19rem,0.85fr)]" : "grid min-w-0 gap-4"}>
    <div className="grid min-w-0 content-start gap-4">{items.map((item, index) => <Panel key={item.id} className="grid content-start gap-4">
      <div className="flex items-center justify-between gap-3"><EditableItemHeading index={index} value={item.itemLabel} onChange={(itemLabel) => update({ ...item, itemLabel })} onBlur={(itemLabel) => update({ ...item, itemLabel })} /><button type="button" disabled={items.length === 1} onClick={() => setItems((current) => current.filter((row) => row.id !== item.id))} className="inline-flex size-8 shrink-0 items-center justify-center rounded-md border border-border text-muted-foreground disabled:opacity-40" aria-label={`Remove item ${index + 1}`}><Trash2 className="size-4" /></button></div>
      <div className="grid gap-4 md:grid-cols-[1fr_140px]"><GarmentCombobox garments={referenceData.garments} value={item.garmentId} onChange={(garmentId) => update({ ...item, garmentId })} /><label className="grid gap-2 text-xs text-muted-foreground">Quantity<input min={50} max={10000} type="number" value={item.quantity} onChange={(event) => update({ ...item, quantity: Number(event.target.value) })} className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground" /></label></div>
      <div className="grid gap-2"><span className="text-xs font-medium text-muted-foreground">Print</span><div className="grid gap-2 sm:grid-cols-2">{positions.map((position) => { const selection = item.printPositions.find((row) => row.position === position.value); return <label key={position.value} className="flex min-h-10 items-center justify-between gap-2 rounded-md border border-border bg-background px-3 text-sm"><span><input type="checkbox" checked={Boolean(selection)} onChange={(event) => update({ ...item, printPositions: event.target.checked ? [...item.printPositions, { position: position.value, colourCount: position.value.startsWith("NECK_") ? undefined : 1 }] : item.printPositions.filter((row) => row.position !== position.value) })} className="mr-2 accent-primary" />{position.label}</span>{selection && !position.value.startsWith("NECK_") ? <input aria-label={`${position.label} colours`} type="number" min={1} max={10} value={selection.colourCount ?? 1} onChange={(event) => update({ ...item, printPositions: item.printPositions.map((row) => row.position === position.value ? { ...row, colourCount: Number(event.target.value) } : row) })} className="h-7 w-14 rounded border border-input bg-card px-2" /> : null}</label>; })}</div></div>
      <div className="grid gap-2"><span className="text-xs font-medium text-muted-foreground">Embroidery stitch count</span><div className="grid gap-2 sm:grid-cols-3">{item.embroideryStitches.map((value, slot) => <input key={slot} type="number" min={7000} step={1} placeholder="None" value={value ?? ""} onChange={(event) => { const next = [...item.embroideryStitches]; next[slot] = event.target.value === "" ? null : Number(event.target.value); update({ ...item, embroideryStitches: next }); }} className="h-9 rounded-md border border-input bg-background px-3 text-sm" />)}</div></div>
      <CalculatorErrors errors={results[index].errors} />
    </Panel>)}</div>
    {hasValidItems ? <div className="grid min-w-0 content-start gap-4"><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1"><Panel className="p-4"><div className="text-xs text-muted-foreground">Garment Cost</div><div className="mt-2 text-2xl font-semibold tabular-nums">{money(garmentCost)}</div></Panel><Panel className="p-4"><div className="text-xs text-muted-foreground">Total Cost</div><div className="mt-2 text-2xl font-semibold tabular-nums">{money(totals)}</div><button type="button" onClick={() => void copyQuote()} className="mt-4 inline-flex items-center gap-2 text-sm text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><>{copyState === "copied" ? <Check className="size-4" /> : <Copy className="size-4" />}</> {copyState === "copied" ? "Copied" : copyState === "error" ? "Copy unavailable" : "Copy quote"}</button></Panel></div></div> : null}
    </div>
    {hasValidItems ? <UkTradeBreakdown items={items} results={results} screenSetupUnitPrice={screenSetupUnitPrice} /> : null}
  </div>;
}
