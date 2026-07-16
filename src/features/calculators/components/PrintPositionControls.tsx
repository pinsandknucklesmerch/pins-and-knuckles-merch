"use client";

import type { EuPrintPosition, EuPrintSelection } from "../domain/types.ts";

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
}: PrintPositionControlsProps) {
  function setPositionEnabled(position: EuPrintPosition, enabled: boolean) {
    if (!enabled) {
      onChange(value.filter((selection) => selection.position !== position));
      return;
    }

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
      <div className="grid gap-2 sm:grid-cols-2">
        {PRINT_POSITIONS.map((position) => {
          const selection = getSelection(value, position.value);
          const enabled = Boolean(selection);

          return (
            <div
              key={position.value}
              className="flex min-h-10 items-center justify-between gap-3 rounded-md border border-border bg-background px-3 py-2"
            >
              <label className="flex items-center gap-2 text-sm text-foreground">
                <input
                  type="checkbox"
                  checked={enabled}
                  onChange={(event) =>
                    setPositionEnabled(position.value, event.target.checked)
                  }
                  className="size-4 rounded border-input bg-background accent-primary"
                />
                {position.label}
              </label>
              {enabled && position.value !== "NECK" ? (
                <input
                  aria-label={`${position.label} colours`}
                  className="h-8 w-16 rounded-md border border-input bg-card px-2 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-ring"
                  min={1}
                  max={9}
                  type="number"
                  value={selection?.colourCount ?? 1}
                  onChange={(event) =>
                    setColourCount(position.value, Number(event.target.value))
                  }
                />
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
