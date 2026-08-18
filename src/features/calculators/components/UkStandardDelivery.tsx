"use client";

import { Select } from "@/components/ui/Select";

export function UkStandardDelivery({ enabled, area, boxCount, onEnabledChange, onAreaChange, onBoxCountChange }: { enabled: boolean; area: string; boxCount: string; onEnabledChange: (value: boolean) => void; onAreaChange: (value: string) => void; onBoxCountChange: (value: string) => void }) {
  return <div className="grid gap-3">
    <label className="flex items-center gap-2 text-sm text-foreground"><input type="checkbox" checked={enabled} onChange={(event) => onEnabledChange(event.target.checked)} className="size-4 shrink-0 rounded border-input bg-background accent-primary" />Include delivery</label>
    {enabled ? <div className="grid gap-3 rounded-md border border-border/70 bg-background/55 p-3 sm:grid-cols-2">
      <label className="grid gap-1.5 text-xs font-medium text-muted-foreground">Delivery area<Select value={area} placeholder="Select delivery area" onValueChange={onAreaChange}><option value="UK_MAINLAND">UK Mainland</option><option value="NORTHERN_IRELAND">Northern Ireland</option></Select></label>
      <label className="grid gap-1.5 text-xs font-medium text-muted-foreground">Number of boxes<input className="hub-native-control" type="text" inputMode="numeric" value={boxCount} onChange={(event) => onBoxCountChange(event.target.value.replace(/\D/g, ""))} /></label>
      <div className="text-xs text-muted-foreground sm:col-span-2">Delivery result —</div>
    </div> : null}
  </div>;
}
