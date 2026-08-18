"use client";

import { Select } from "@/components/ui/Select";
import { normaliseUkStandardColourInput } from "../domain/ukStandardInteractions.ts";
import { CalculatorPositionToggle } from "./CalculatorPositionToggle";
import { PrintColourCountInput } from "./PrintColourCountInput";
import type {
  UkStandardDecorationType,
  UkStandardNeckOption,
  UkStandardPrintPosition,
  UkStandardPrintSelection,
} from "../domain/ukStandardTypes.ts";

const positions: Array<{ value: UkStandardPrintPosition; label: string }> = [
  { value: "FRONT", label: "Front" },
  { value: "BACK", label: "Back" },
  { value: "LEFT_SLEEVE", label: "Left Sleeve" },
  { value: "RIGHT_SLEEVE", label: "Right Sleeve" },
  { value: "NECK", label: "Neck" },
];

const decorationTypes: Array<{ value: UkStandardDecorationType; label: string }> = [
  { value: "SCREEN_PRINT", label: "Screen Print" },
  { value: "EMBROIDERY", label: "Embroidery" },
  { value: "TRANSFER_DTF", label: "Transfer / DTF" },
  { value: "DTG", label: "DTG" },
];

function selectionFor(value: UkStandardPrintSelection[], position: UkStandardPrintPosition) {
  return value.find((selection) => selection.position === position);
}

export function UkStandardDecorationControls({ value, onChange }: { value: UkStandardPrintSelection[]; onChange: (value: UkStandardPrintSelection[]) => void }) {
  function toggle(position: UkStandardPrintPosition) {
    const existing = selectionFor(value, position);
    if (existing) onChange(value.filter((selection) => selection.position !== position));
    else onChange([...value, { position, decorationType: "SCREEN_PRINT", colourCount: "1", ...(position === "NECK" ? { neckOption: "STANDARD" as UkStandardNeckOption } : {}) }]);
  }

  function update(position: UkStandardPrintPosition, patch: Partial<UkStandardPrintSelection>) {
    onChange(value.map((selection) => selection.position === position ? { ...selection, ...patch } : selection));
  }

  return <div className="grid gap-3">
    <div className="text-xs font-medium text-muted-foreground">Print positions</div>
    <div className="flex flex-wrap gap-2">
      {positions.map((position) => <CalculatorPositionToggle key={position.value} label={position.label} selected={Boolean(selectionFor(value, position.value))} onClick={() => toggle(position.value)} />)}
    </div>
    <div className="grid gap-2">
      {positions.map((position) => {
        const selection = selectionFor(value, position.value);
        if (!selection) return null;
        return <div key={position.value} className="grid min-w-0 gap-3 rounded-md border border-border/70 bg-background/55 p-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,140px)_minmax(0,120px)]">
          <label className="grid gap-1.5 text-xs font-medium text-muted-foreground">{position.label} decoration<Select value={selection.decorationType} onValueChange={(decorationType) => update(position.value, { decorationType: decorationType as UkStandardDecorationType })}>{decorationTypes.map((type) => <option key={type.value} value={type.value}>{type.label}</option>)}</Select></label>
          <label className="grid gap-1.5 text-xs font-medium text-muted-foreground">Print colours<PrintColourCountInput ariaLabel={`${position.label} print colours`} max={9} value={selection.colourCount} onValueChange={(nextValue) => update(position.value, { colourCount: normaliseUkStandardColourInput(nextValue) })} /></label>
          {position.value === "NECK" ? <label className="grid gap-1.5 text-xs font-medium text-muted-foreground">Neck option<Select value={selection.neckOption ?? "STANDARD"} onValueChange={(neckOption) => update(position.value, { neckOption: neckOption as UkStandardNeckOption })}><option value="STANDARD">Standard</option><option value="TRANSFER">Transfer</option></Select></label> : <div aria-hidden="true" />}
        </div>;
      })}
    </div>
  </div>;
}
