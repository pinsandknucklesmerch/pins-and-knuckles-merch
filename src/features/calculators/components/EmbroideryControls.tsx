"use client";

import type { EuEmbroiderySelection, EuEmbroiderySize } from "../domain/types.ts";
import { Select } from "@/components/ui/Select";

type EmbroideryControlsProps = {
  value: EuEmbroiderySelection[];
  onChange: (value: EuEmbroiderySelection[]) => void;
};

const SIZE_OPTIONS: Array<{ value: EuEmbroiderySize; label: string }> = [
  { value: "small", label: "Small" },
  { value: "medium", label: "Medium" },
  { value: "large", label: "Large" },
];

export function EmbroideryControls({ value, onChange }: EmbroideryControlsProps) {
  function setItem(index: number, size: string) {
    const next = [...value];
    if (!size) {
      next.splice(index, 1);
      onChange(next);
      return;
    }

    next[index] = { size: size as EuEmbroiderySize };
    onChange(next);
  }

  return (
    <div className="grid gap-2">
      <div className="text-xs font-medium text-muted-foreground">Embroidery</div>
      <div className="flex flex-wrap gap-2">
        {[0, 1, 2].map((index) => {
          const selected = Boolean(value[index]);
          const unavailable = index > value.length;
          return <button key={index} type="button" aria-pressed={selected} disabled={unavailable} onClick={() => setItem(index, selected ? "" : "small")} className={`min-h-9 rounded-md border px-3 py-1.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${selected ? "border-primary bg-primary/15 text-foreground" : "border-border bg-background text-muted-foreground hover:bg-secondary hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"}`}>Embroidery {index + 1}</button>;
        })}
      </div>
      <div className="grid gap-2 sm:grid-cols-3">
        {[0, 1, 2].map((index) => value[index] ? (
          <div key={index} className="grid gap-2 rounded-md border border-border/70 bg-background/55 p-3">
            <div className="text-xs font-medium text-muted-foreground">Embroidery {index + 1}</div>
            <Select value={value[index].size} onValueChange={(size) => setItem(index, size)}>
              {SIZE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </Select>
          </div>
        ) : null)}
      </div>
    </div>
  );
}
