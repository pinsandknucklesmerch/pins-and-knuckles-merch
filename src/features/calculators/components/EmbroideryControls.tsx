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
      <div className="grid gap-2 sm:grid-cols-3">
        {[0, 1, 2].map((index) => (
          <Select
            key={index}
            value={value[index]?.size ?? ""}
            onValueChange={(value) => setItem(index, value)}
          >
            <option value="">None</option>
            {SIZE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        ))}
      </div>
    </div>
  );
}
