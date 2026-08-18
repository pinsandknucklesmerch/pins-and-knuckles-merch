"use client";

import type { EuPrintPosition, EuPrintSelection } from "../domain/types.ts";
import { normaliseEuPrintColourInput } from "../domain/euCalculatorInteractions.ts";
import { useState } from "react";
import { CalculatorPositionToggle } from "./CalculatorPositionToggle";
import { PrintColourCountInput } from "./PrintColourCountInput";

const PRINT_POSITIONS: Array<{ value: EuPrintPosition; label: string }> = [
  { value: "FRONT", label: "Front" },
  { value: "BACK", label: "Back" },
  { value: "LEFT_SLEEVE", label: "Left Sleeve" },
  { value: "RIGHT_SLEEVE", label: "Right Sleeve" },
  { value: "NECK", label: "Neck" },
];

type PrintPositionControlsProps = {
  value: EuPrintSelection[];
  onChange: (value: EuPrintSelection[]) => void;
  onPositionSelect?: () => void;
};

function getSelection(
  selections: EuPrintSelection[],
  position: EuPrintPosition,
) {
  return selections.find((selection) => selection.position === position);
}

export function PrintPositionControls({
  value,
  onChange,
  onPositionSelect,
}: PrintPositionControlsProps) {
  const [draftColourCounts, setDraftColourCounts] = useState<Record<string, string>>({});

  function setPositionEnabled(position: EuPrintPosition, enabled: boolean) {
    if (!enabled) {
      onChange(value.filter((selection) => selection.position !== position));
      return;
    }

    onPositionSelect?.();

    onChange([
      ...value,
      position === "NECK"
        ? { position }
        : {
            position,
            colourCount: 1,
          },
    ]);
  }

  function setColourCount(position: EuPrintPosition, colourCount: number | undefined) {
    onChange(
      value.map((selection) =>
        selection.position === position ? { ...selection, colourCount } : selection,
      ),
    );
  }

  return (
    <div className="grid gap-2">
      <div className="text-xs font-medium text-muted-foreground">Print</div>
      <div className="flex flex-wrap gap-2">
        {PRINT_POSITIONS.map((position) => {
          const selection = getSelection(value, position.value);
          const enabled = Boolean(selection);

          return (
            <CalculatorPositionToggle key={position.value} label={position.label} selected={enabled} onClick={() => setPositionEnabled(position.value, !enabled)} />
          );
        })}
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {PRINT_POSITIONS.filter((position) => getSelection(value, position.value) && position.value !== "NECK").map((position) => {
          const selection = getSelection(value, position.value);
          if (!selection) return null;
          const draftValue = draftColourCounts[position.value] ?? String(selection.colourCount ?? "");
          return (
                <label
                  key={position.value}
                  className="flex items-center justify-between gap-3 rounded-md border border-border/70 bg-background/55 px-3 py-2 text-xs text-muted-foreground"
                >
                  {position.label} colours
                  <PrintColourCountInput ariaLabel={`${position.label} colours`} max={9} value={draftValue} onValueChange={(nextValue) => {
                    const normalisedValue = normaliseEuPrintColourInput(nextValue);
                    setDraftColourCounts((current) => ({
                      ...current,
                      [position.value]: normalisedValue,
                    }));
                    setColourCount(position.value, normalisedValue ? Number(normalisedValue) : undefined);
                  }} />
                </label>
          );
        })}
      </div>
    </div>
  );
}
