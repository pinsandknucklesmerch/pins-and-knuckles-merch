"use client";

import { Trash2 } from "lucide-react";
import { Panel } from "@/components/ui/Panel";
import type { EuCalculatorItemInput, Garment } from "../domain/types.ts";
import { CalculatorErrors } from "./CalculatorErrors";
import { EmbroideryControls } from "./EmbroideryControls";
import { GarmentCombobox } from "./GarmentCombobox";
import { EditableItemHeading } from "./EditableItemHeading";
import { PrintPositionControls } from "./PrintPositionControls";
import type { CalculatorValidationError } from "../domain/types.ts";
import { normaliseEuPkMarkupInput } from "../domain/euCalculatorInteractions.ts";
import { useState } from "react";

type EuItemCardProps = {
  item: EuCalculatorItemInput;
  index: number;
  garments: Garment[];
  errors: CalculatorValidationError[];
  canRemove: boolean;
  onChange: (item: EuCalculatorItemInput) => void;
  onRemove: () => void;
  onPrintPositionSelect: () => void;
};

export function EuItemCard({
  item,
  index,
  garments,
  errors,
  canRemove,
  onChange,
  onRemove,
  onPrintPositionSelect,
}: EuItemCardProps) {
  const [pkMarkupDraft, setPkMarkupDraft] = useState(String(item.pkMarkupPerUnit ?? 0));
  return (
    <Panel className="border-border/90 bg-card">
      <div className="grid min-w-0 gap-4">
        <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
          <EditableItemHeading
            index={index}
            value={item.itemLabel ?? ""}
            onChange={(itemLabel) => onChange({ ...item, itemLabel })}
            onBlur={(itemLabel) => onChange({ ...item, itemLabel })}
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

        <div className="grid min-w-0 gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,140px)]">
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
          onPositionSelect={onPrintPositionSelect}
        />

        <EmbroideryControls
          value={item.embroideryItems ?? []}
          onChange={(embroideryItems) => onChange({ ...item, embroideryItems })}
        />

        <div className="grid min-w-0 gap-2 rounded-md border border-border/70 bg-background/55 p-3 backdrop-blur-sm sm:grid-cols-[minmax(0,1fr)_minmax(0,140px)]">
          <label className="flex min-w-0 items-center gap-2 text-sm text-foreground">
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
            className="h-8 w-full min-w-0 rounded-md border border-input bg-card px-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-ring disabled:opacity-50"
            disabled={!item.pkMarkupEnabled}
            type="text"
            inputMode="decimal"
            pattern="-?[0-9]*\.?[0-9]*"
            value={pkMarkupDraft}
            onChange={(event) => {
              const value = normaliseEuPkMarkupInput(event.target.value);
              setPkMarkupDraft(value);
              const numericValue = Number(value);
              onChange({ ...item, pkMarkupPerUnit: Number.isFinite(numericValue) && value !== "" && value !== "-" && value !== "." && value !== "-." ? numericValue : undefined });
            }}
            onBlur={() => {
              const value = normaliseEuPkMarkupInput(pkMarkupDraft);
              const numericValue = Number(value);
              if (!Number.isFinite(numericValue) || value === "" || value === "-" || value === "." || value === "-.") {
                setPkMarkupDraft("0");
                onChange({ ...item, pkMarkupPerUnit: 0 });
              } else {
                setPkMarkupDraft(value);
                onChange({ ...item, pkMarkupPerUnit: numericValue });
              }
            }}
          />
        </div>

        <CalculatorErrors errors={errors} />
      </div>
    </Panel>
  );
}
