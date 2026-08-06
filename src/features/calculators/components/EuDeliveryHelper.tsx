"use client";

import { Copy } from "lucide-react";
import { useMemo } from "react";
import { calculateEuDelivery, formatEuDeliveryCopy } from "../domain/euDeliveryHelper.ts";
import type { DeliveryRate } from "../domain/types.ts";
import { Select } from "@/components/ui/Select";
import { Surface } from "@/components/ui/Surface";
import { copyText } from "@/components/ui/copyText";

type EuDeliveryHelperProps = {
  deliveryRates: DeliveryRate[];
  deliveryRatesError?: string | null;
  country: string | null;
  boxCount: number;
  markupEnabled: boolean;
  markupPerBox: number;
  onCountryChange: (country: string | null) => void;
  onBoxCountChange: (boxCount: number) => void;
  onMarkupEnabledChange: (enabled: boolean) => void;
  onMarkupPerBoxChange: (markupPerBox: number) => void;
};

const money = (value: number) => new Intl.NumberFormat("en-GB", { style: "currency", currency: "EUR" }).format(value);

function Row({ label, value, strong = false }: { label: string; value: string; strong?: boolean }) {
  return <div className={`grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-start gap-3 py-1.5 text-sm ${strong ? "border-t border-border pt-3 font-semibold text-foreground" : "text-muted-foreground"}`}><dt className="min-w-0 break-words">{label}</dt><dd className="min-w-0 whitespace-nowrap text-right font-medium tabular-nums text-foreground">{value}</dd></div>;
}

export function EuDeliveryHelper({ deliveryRates, deliveryRatesError, country, boxCount, markupEnabled, markupPerBox, onCountryChange, onBoxCountChange, onMarkupEnabledChange, onMarkupPerBoxChange }: EuDeliveryHelperProps) {
  const delivery = useMemo(() => calculateEuDelivery({ country, boxCount, markupEnabled, markupPerBox }, deliveryRates, deliveryRatesError), [boxCount, country, deliveryRates, deliveryRatesError, markupEnabled, markupPerBox]);

  async function copyDelivery() {
    if (!delivery.ok) return;
    await copyText(formatEuDeliveryCopy(delivery));
  }

  return <Surface aria-label="Delivery helper" className="min-w-0">
    <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(18rem,0.85fr)]">
      <div className="grid min-w-0 gap-3">
        <label className="grid min-w-0 gap-1.5 text-xs font-medium text-muted-foreground">Delivery area<Select value={country ?? ""} placeholder="Select delivery area" onValueChange={(value) => onCountryChange(value || null)} disabled={Boolean(deliveryRatesError) || deliveryRates.length === 0}>{deliveryRates.map((rate) => <option key={rate.country} value={rate.country}>{rate.country}</option>)}</Select></label>
        <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 2xl:grid-cols-4">
          <label className="grid min-w-0 gap-1.5 text-xs font-medium text-muted-foreground"><span className="min-w-0 break-words">Number of boxes</span><input type="number" min={1} step={1} value={Number.isFinite(boxCount) ? boxCount : ""} onChange={(event) => onBoxCountChange(Number(event.target.value))} className="hub-native-control" /></label>
          <div className="grid min-w-0 gap-1.5 text-xs font-medium text-muted-foreground"><span className="min-w-0 break-words">Cost per box</span><output className="flex h-9 min-w-0 items-center whitespace-nowrap rounded-md border border-input bg-background px-3 text-sm font-medium text-foreground">{delivery.ok ? `${money(delivery.rate.costPerBox)} excl. VAT` : "—"}</output></div>
          <div className="grid min-w-0 gap-1.5 text-xs font-medium text-muted-foreground"><span className="min-w-0 break-words">Delivery time</span><output className="flex h-9 min-w-0 items-center whitespace-nowrap rounded-md border border-input bg-background px-3 text-sm font-medium text-foreground">{delivery.ok ? delivery.rate.deliveryTime : "—"}</output></div>
          <div className="grid min-w-0 gap-1.5"><label className="flex min-w-0 items-start gap-2 text-xs text-muted-foreground"><input type="checkbox" checked={markupEnabled} onChange={(event) => onMarkupEnabledChange(event.target.checked)} className="mt-0.5 size-3.5 shrink-0 accent-primary" /><span className="min-w-0 break-words">Delivery markup</span></label>{markupEnabled && <input aria-label="Delivery markup per box" type="number" step="0.01" value={Number.isFinite(markupPerBox) ? markupPerBox : ""} onChange={(event) => onMarkupPerBoxChange(Number(event.target.value))} className="hub-native-control" />}</div>
        </div>
      </div>
      <Surface variant="compact" className="min-w-0 bg-background/55" aria-label="Delivery summary">
        <div className="mb-3 flex min-w-0 flex-wrap items-start justify-between gap-3"><h2 className="min-w-0 break-words text-sm font-semibold text-foreground">Delivery Summary</h2><button type="button" onClick={copyDelivery} disabled={!delivery.ok} className="inline-flex max-w-full shrink-0 items-center gap-1.5 rounded-md border border-primary/60 px-2 py-1 text-xs text-primary transition-colors hover:bg-primary/10 disabled:opacity-50"><Copy className="size-3.5" />Copy Delivery Info</button></div>
        {delivery.ok ? <dl><Row label="Selected country" value={delivery.rate.country} /><Row label="Delivery time" value={delivery.rate.deliveryTime} /><Row label="Cost per box excl. VAT" value={money(delivery.rate.costPerBox)} /><Row label="Number of boxes" value={String(delivery.boxCount)} /><Row label="Delivery subtotal excl. VAT" value={money(delivery.deliverySubtotalExclVat)} /><Row label={`VAT (${delivery.rate.vatRate}%)`} value={money(delivery.deliveryVatAmount)} /><Row label="Total delivery cost incl. VAT" value={money(delivery.deliveryTotalInclVat)} strong /></dl> : <p role="alert" className="text-sm text-destructive">{delivery.error}</p>}
      </Surface>
    </div>
  </Surface>;
}
