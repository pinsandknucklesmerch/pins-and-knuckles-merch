"use client";

import { Check, Copy } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { calculateEuDelivery, formatEuDeliveryCopy } from "../domain/euDeliveryHelper.ts";
import type { DeliveryRate } from "../domain/types.ts";

type EuDeliveryHelperProps = {
  deliveryRates: DeliveryRate[];
  deliveryRatesError?: string | null;
};

const money = (value: number) => new Intl.NumberFormat("en-GB", { style: "currency", currency: "EUR" }).format(value);

function Row({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return <div className={`flex items-start justify-between gap-3 py-1.5 text-sm ${strong ? "border-t border-border pt-3 font-semibold text-foreground" : "text-muted-foreground"}`}><dt className="min-w-0 break-words">{label}</dt><dd className="min-w-0 max-w-[60%] break-words text-right font-medium tabular-nums text-foreground">{value}</dd></div>;
}

export function EuDeliveryHelper({ deliveryRates, deliveryRatesError }: EuDeliveryHelperProps) {
  const [country, setCountry] = useState<string | null>(deliveryRates[0]?.country ?? null);
  const [boxCount, setBoxCount] = useState(1);
  const [markupEnabled, setMarkupEnabled] = useState(false);
  const [markupPerBox, setMarkupPerBox] = useState(0);
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">("idle");
  const resetTimeout = useRef<number | null>(null);
  const delivery = useMemo(() => calculateEuDelivery({ country, boxCount, markupEnabled, markupPerBox }, deliveryRates, deliveryRatesError), [boxCount, country, deliveryRates, deliveryRatesError, markupEnabled, markupPerBox]);

  useEffect(() => () => { if (resetTimeout.current !== null) window.clearTimeout(resetTimeout.current); }, []);

  async function copyDelivery() {
    if (!delivery.ok) return;
    try {
      await navigator.clipboard.writeText(formatEuDeliveryCopy(delivery));
      setCopyState("copied");
      if (resetTimeout.current !== null) window.clearTimeout(resetTimeout.current);
      resetTimeout.current = window.setTimeout(() => setCopyState("idle"), 2200);
    } catch {
      setCopyState("error");
    }
  }

  return <details className="group rounded-lg border border-border/90 bg-card/75" aria-label="Delivery helper">
    <summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden"><span className="flex items-center justify-between gap-3">Delivery Costs <span className="text-xs text-primary">Sales helper</span><span className="ml-auto text-muted-foreground transition-transform group-open:rotate-180">⌄</span></span></summary>
    <div className="grid gap-4 border-t border-border p-4 lg:grid-cols-[minmax(0,1fr)_minmax(20rem,0.9fr)]">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-2 text-xs font-medium text-muted-foreground sm:col-span-2">Delivery area<select value={country ?? ""} onChange={(event) => setCountry(event.target.value || null)} disabled={Boolean(deliveryRatesError) || deliveryRates.length === 0} className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground disabled:opacity-50"><option value="">Select delivery area</option>{deliveryRates.map((rate) => <option key={rate.country} value={rate.country}>{rate.country}</option>)}</select></label>
        <label className="grid gap-2 text-xs font-medium text-muted-foreground">Number of boxes<input type="number" min={1} step={1} value={Number.isFinite(boxCount) ? boxCount : ""} onChange={(event) => setBoxCount(Number(event.target.value))} className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground" /></label>
        <label className="grid gap-2 text-xs font-medium text-muted-foreground">Cost per box<output className="flex h-9 items-center rounded-md border border-input bg-background px-3 text-sm font-medium text-foreground">{delivery.ok ? `${money(delivery.rate.costPerBox)} excl. VAT` : "—"}</output></label>
        <label className="grid gap-2 text-xs font-medium text-muted-foreground">Delivery time<output className="flex h-9 items-center rounded-md border border-input bg-background px-3 text-sm font-medium text-foreground">{delivery.ok ? delivery.rate.deliveryTime : "—"}</output></label>
        <div className="grid gap-2"><label className="flex h-5 items-center gap-2 text-xs text-muted-foreground"><input type="checkbox" checked={markupEnabled} onChange={(event) => setMarkupEnabled(event.target.checked)} className="size-3.5 accent-primary" />Delivery markup</label>{markupEnabled ? <input aria-label="Delivery markup per box" type="number" step="0.01" value={Number.isFinite(markupPerBox) ? markupPerBox : ""} onChange={(event) => setMarkupPerBox(Number(event.target.value))} className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground" /> : <output className="flex h-9 items-center rounded-md border border-input bg-background px-3 text-xs text-muted-foreground">No delivery markup applied</output>}</div>
      </div>
      <section className="min-w-0 rounded-md border border-border/80 bg-background/55 p-3" aria-label="Delivery summary">
        <div className="mb-3 flex min-w-0 items-start justify-between gap-3"><h2 className="min-w-0 text-sm font-semibold text-foreground">Delivery Summary</h2><button type="button" onClick={copyDelivery} disabled={!delivery.ok} className="inline-flex shrink-0 items-center gap-1.5 rounded-md border border-primary/60 px-2 py-1 text-xs text-primary transition-colors hover:bg-primary/10 disabled:opacity-50"><>{copyState === "copied" ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}</>{copyState === "copied" ? "Copied" : copyState === "error" ? "Copy unavailable" : "Copy Delivery Info"}</button></div>
        {delivery.ok ? <dl><Row label="Selected country" value={delivery.rate.country} /><Row label="Delivery time" value={delivery.rate.deliveryTime} /><Row label="Cost per box excl. VAT" value={money(delivery.rate.costPerBox)} /><Row label="Number of boxes" value={String(delivery.boxCount)} /><Row label="Delivery subtotal excl. VAT" value={money(delivery.deliverySubtotalExclVat)} /><Row label={`VAT (${delivery.rate.vatRate}%)`} value={money(delivery.deliveryVatAmount)} /><Row label="Total delivery cost incl. VAT" value={money(delivery.deliveryTotalInclVat)} strong /></dl> : <p role="alert" className="text-sm text-destructive">{delivery.error}</p>}
      </section>
    </div>
  </details>;
}
