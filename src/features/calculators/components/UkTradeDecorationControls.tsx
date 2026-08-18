"use client";

import type { UkTradeItemInput, UkTradePrintPosition } from "../domain/types.ts";
import { normaliseUkTradeColourInput, toggleUkTradeEmbroidery, toggleUkTradePrintPosition } from "../domain/ukTradeCalculatorInteractions.ts";
import { CalculatorPositionToggle } from "./CalculatorPositionToggle";
import { PrintColourCountInput } from "./PrintColourCountInput";

const PRINT_POSITIONS: Array<{ value: UkTradePrintPosition; label: string }> = [
  { value: "FRONT", label: "Front" },
  { value: "BACK", label: "Back" },
  { value: "LEFT_SLEEVE", label: "Left Sleeve" },
  { value: "RIGHT_SLEEVE", label: "Right Sleeve" },
];

const NECK_POSITIONS: Array<{ value: UkTradePrintPosition; label: string }> = [
  { value: "NECK_PRINT_STANDARD", label: "Neck Print Standard" },
  { value: "NECK_PRINT_TRANSFER", label: "Neck Print Transfer" },
];

type Props = {
  printPositions: UkTradeItemInput["printPositions"];
  embroideryStitches: UkTradeItemInput["embroideryStitches"];
  onPrintPositionsChange: (value: UkTradeItemInput["printPositions"]) => void;
  onEmbroideryChange: (value: UkTradeItemInput["embroideryStitches"]) => void;
  onDecorationSelect?: () => void;
};

export function UkTradeDecorationControls({ printPositions, embroideryStitches, onPrintPositionsChange, onEmbroideryChange, onDecorationSelect }: Props) {
  const getPrint = (position: UkTradePrintPosition) => printPositions.find((entry) => entry.position === position);

  function setPrint(position: UkTradePrintPosition) {
    const selected = Boolean(getPrint(position));
    if (!selected) onDecorationSelect?.();
    onPrintPositionsChange(toggleUkTradePrintPosition(printPositions, position, !selected));
  }

  return (
    <div className="grid gap-4">
      <div className="grid gap-2">
        <div className="text-xs font-medium text-muted-foreground">Print</div>
        <div className="flex flex-wrap gap-2">
          {PRINT_POSITIONS.map((position) => <CalculatorPositionToggle key={position.value} label={position.label} selected={Boolean(getPrint(position.value))} onClick={() => setPrint(position.value)} />)}
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {PRINT_POSITIONS.map((position) => {
            const selection = getPrint(position.value);
            if (!selection) return null;
            return <label key={position.value} className="flex items-center justify-between gap-3 rounded-md border border-border/70 bg-background/55 px-3 py-2 text-xs text-muted-foreground">
              {position.label} colours
              <PrintColourCountInput ariaLabel={`${position.label} colours`} max={10} value={selection.colourCount ? String(selection.colourCount) : ""} onValueChange={(nextValue) => { const value = normaliseUkTradeColourInput(nextValue); onPrintPositionsChange(printPositions.map((entry) => entry.position === position.value ? { ...entry, colourCount: value ? Number(value) : undefined } : entry)); }} />
            </label>;
          })}
        </div>
      </div>

      <div className="grid gap-2">
        <div className="text-xs font-medium text-muted-foreground">Neck</div>
        <div className="flex flex-wrap gap-2">
          {NECK_POSITIONS.map((position) => <CalculatorPositionToggle key={position.value} label={position.label} selected={Boolean(getPrint(position.value))} onClick={() => setPrint(position.value)} />)}
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {NECK_POSITIONS.map((position) => getPrint(position.value) ? <div key={position.value} className="rounded-md border border-border/70 bg-background/55 px-3 py-2 text-xs text-muted-foreground">{position.label}</div> : null)}
        </div>
      </div>

      <div className="grid gap-2">
        <div className="text-xs font-medium text-muted-foreground">Embroidery</div>
        <div className="flex flex-wrap gap-2">
          {[0, 1, 2].map((index) => <CalculatorPositionToggle key={index} label={`Embroidery ${index + 1}`} selected={embroideryStitches[index] !== null} onClick={() => { if (embroideryStitches[index] === null) onDecorationSelect?.(); onEmbroideryChange(toggleUkTradeEmbroidery(embroideryStitches, index, embroideryStitches[index] === null)); }} />)}
        </div>
        <div className="grid gap-2 sm:grid-cols-3">
          {embroideryStitches.map((value, index) => value === null ? null : <label key={index} className="grid gap-2 rounded-md border border-border/70 bg-background/55 p-3 text-xs text-muted-foreground">Embroidery {index + 1} stitches<input aria-label={`Embroidery ${index + 1} stitches`} className="hub-native-control h-8" min={7000} type="number" value={value} onChange={(event) => { const next = [...embroideryStitches]; next[index] = event.target.value === "" ? null : Number(event.target.value); onEmbroideryChange(next); }} /></label>)}
        </div>
      </div>
    </div>
  );
}
