import type { UkTradeItemInput, UkTradePrintPosition } from "./types.ts";

export function toggleUkTradePrintPosition(
  positions: UkTradeItemInput["printPositions"],
  position: UkTradePrintPosition,
  selected: boolean,
) {
  if (!selected) {
    return positions.filter((entry) => entry.position !== position);
  }

  if (positions.some((entry) => entry.position === position)) return positions;

  return [
    ...positions,
    {
      position,
      ...(position.startsWith("NECK_") ? {} : { colourCount: 1 }),
    },
  ];
}

export function toggleUkTradeEmbroidery(
  stitches: UkTradeItemInput["embroideryStitches"],
  index: number,
  selected: boolean,
) {
  const next = [...stitches];
  next[index] = selected ? 7000 : null;
  return next;
}
