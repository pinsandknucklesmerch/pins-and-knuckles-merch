"use client";

import { Trash2 } from "lucide-react";
import { Panel } from "@/components/ui/Panel";
import { getEuItemLabel } from "../domain/euQuoteFormatter.ts";
import type { EuCalculatorItemInput, Garment } from "../domain/types.ts";
import { CalculatorErrors } from "./CalculatorErrors";
import { EmbroideryControls } from "./EmbroideryControls";
import { GarmentCombobox } from "./GarmentCombobox";
import { PrintPositionControls } from "./PrintPositionControls";
import type { CalculatorValidationError } from "../domain/types.ts";

type EuItemCardProps = {
  item: EuCalculatorItemInput;
  index: number;
  garments: Garment[];
  errors: CalculatorValidationError[];
  canRemove: boolean;
  onChange: (item: EuCalculatorItemInput) => void;
  onRemove: () => void;
};

export function EuItemCard({
  item,
  index,
  garments,
  errors,
  canRemove,
  onChange,
  onRemove,
}: EuItemCardProps) {
  return (
    <Panel
      className="min-h-[520px] border-border/90 bg-card"
    >
      <div className="grid gap-4">
        <div className="flex items-center justify-between gap-3">
          <input
            aria-label={`Design name for ${getEuItemLabel(item.itemLabel, index)}`}
            className="min-w-0 max-w-[16rem] rounded-md border border-transparent bg-transparent px-1 py-0.5 text-sm font-semibold text-foreground outline-none transition-colors placeholder:text-foreground focus:border-input focus:bg-background focus:ring-2 focus:ring-ring"
            value={item.itemLabel ?? ""}
            placeholder={getEuItemLabel(undefined, index)}
            onChange={(event) => onChange({ ...item, itemLabel: event.target.value })}
            onBlur={(event) => onChange({ ...item, itemLabel: event.target.value.trim() })}
          />
          <button
            type="button"
            disabled={!canRemove}
            onClick={onRemove}
            className="inline-flex size-8 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
            aria-label={`Remove item ${index + 1}`}
          >
            <Trash2 className="size-4" />
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-[1fr_140px]">
          <GarmentCombobox
            garments={garments}
            value={item.garmentId}
            onChange={(garmentId) => onChange({ ...item, garmentId })}
          />
          <div className="grid gap-2">
            <label className="text-xs font-medium text-muted-foreground">
              Quantity
            </label>
            <input
              className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring"
              min={50}
              max={2000}
              type="number"
              value={item.quantity}
              onChange={(event) =>
                onChange({ ...item, quantity: Number(event.target.value) })
              }
            />
          </div>
        </div>

        <PrintPositionControls
          value={item.printPositions}
          onChange={(printPositions) => onChange({ ...item, printPositions })}
        />

        <EmbroideryControls
          value={item.embroideryItems ?? []}
          onChange={(embroideryItems) => onChange({ ...item, embroideryItems })}
        />

        <div className="grid gap-2 rounded-md border border-border bg-background p-3 sm:grid-cols-[1fr_140px]">
          <label className="flex items-center gap-2 text-sm text-foreground">
            <input
              type="checkbox"
              checked={item.pkMarkupEnabled ?? false}
              onChange={(event) =>
                onChange({ ...item, pkMarkupEnabled: event.target.checked })
              }
              className="size-4 rounded border-input bg-background accent-primary"
            />
            PK markup
          </label>
          <input
            className="h-8 rounded-md border border-input bg-card px-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-ring disabled:opacity-50"
            disabled={!item.pkMarkupEnabled}
            step="0.01"
            type="number"
            value={item.pkMarkupPerUnit ?? 0}
            onChange={(event) =>
              onChange({ ...item, pkMarkupPerUnit: Number(event.target.value) })
            }
          />
        </div>

        <div className="min-h-24">
          <CalculatorErrors errors={errors} />
        </div>
      </div>
    </Panel>
  );
}
