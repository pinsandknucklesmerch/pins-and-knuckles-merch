"use client";

import type { EuPrintPosition, EuPrintSelection } from "../domain/types.ts";
import { normaliseEuPrintColourInput } from "../domain/euCalculatorInteractions.ts";
import { useState } from "react";

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

  function setColourCount(position: EuPrintPosition, colourCount: number) {
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
            <button
              key={position.value}
              type="button"
              aria-pressed={enabled}
              onClick={() => setPositionEnabled(position.value, !enabled)}
              className={`min-h-9 rounded-md border px-3 py-1.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${enabled ? "border-primary bg-primary/15 text-foreground" : "border-border bg-background text-muted-foreground hover:bg-secondary hover:text-foreground"}`}
            >
              {position.label}
            </button>
          );
        })}
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {PRINT_POSITIONS.filter((position) => getSelection(value, position.value) && position.value !== "NECK").map((position) => {
          const selection = getSelection(value, position.value);
          if (!selection) return null;
          const draftValue = draftColourCounts[position.value] ?? String(selection.colourCount ?? 1);
          return (
                <label
                  key={position.value}
                  className="flex items-center justify-between gap-3 rounded-md border border-border/70 bg-background/55 px-3 py-2 text-xs text-muted-foreground"
                >
                  {position.label} colours
                  <input
                  aria-label={`${position.label} colours`}
                  className="h-8 w-16 rounded-md border border-input bg-card px-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-ring"
                  min={1}
                  max={9}
                  type="number"
                  value={draftValue}
                  onChange={(event) => {
                    const nextValue = event.target.value;
                    const normalisedValue = normaliseEuPrintColourInput(nextValue);
                    setDraftColourCounts((current) => ({
                      ...current,
                      [position.value]: normalisedValue === null ? nextValue : String(normalisedValue),
                    }));
                    if (normalisedValue !== null) setColourCount(position.value, normalisedValue);
                  }}
                  onBlur={() => {
                    const nextValue = draftColourCounts[position.value];
                    if (nextValue === "") {
                      setColourCount(position.value, 1);
                      setDraftColourCounts((current) => ({ ...current, [position.value]: "1" }));
                    }
                  }}
                />
                </label>
          );
        })}
      </div>
    </div>
  );
}
