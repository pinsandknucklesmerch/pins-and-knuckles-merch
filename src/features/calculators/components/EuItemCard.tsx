"use client";

import type { EuCalculatorItemInput, Garment } from "../domain/types.ts";
import { CalculatorErrors } from "./CalculatorErrors";
import { CalculatorItemCard } from "./CalculatorItemCard";
import { CalculatorQuantityField } from "./CalculatorQuantityField";
import { EmbroideryControls } from "./EmbroideryControls";
import { GarmentCombobox } from "./GarmentCombobox";
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
    <CalculatorItemCard index={index} itemLabel={item.itemLabel ?? ""} canRemove={canRemove} onItemLabelChange={(itemLabel) => onChange({ ...item, itemLabel })} onItemLabelBlur={(itemLabel) => onChange({ ...item, itemLabel })} onRemove={onRemove}>
        <div className="grid min-w-0 gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,140px)]">
          <GarmentCombobox
            garments={garments}
            value={item.garmentId}
            onChange={(garmentId) => onChange({ ...item, garmentId })}
          />
          <CalculatorQuantityField min={50} max={2000} type="number" value={item.quantity} onChange={(event) => onChange({ ...item, quantity: Number(event.target.value) })} />
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
            className="hub-native-control h-8"
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
    </CalculatorItemCard>
  );
}
