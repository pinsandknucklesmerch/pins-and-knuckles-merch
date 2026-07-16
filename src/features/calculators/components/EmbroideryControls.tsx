"use client";

import type { EuEmbroiderySelection, EuEmbroiderySize } from "../domain/types.ts";

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
      <div className="grid gap-2 sm:grid-cols-3">
        {[0, 1, 2].map((index) => (
          <select
            key={index}
            className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring"
            value={value[index]?.size ?? ""}
            onChange={(event) => setItem(index, event.target.value)}
          >
            <option value="">None</option>
            {SIZE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        ))}
      </div>
    </div>
  );
}
