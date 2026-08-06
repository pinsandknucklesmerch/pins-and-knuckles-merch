import type { UkTradeItemInput, UkTradePrintPosition } from "./types.ts";

export const UK_TRADE_MAX_COLOURS = 10;

export function normaliseUkTradeColourInput(value: string, max = UK_TRADE_MAX_COLOURS) {
  const digits = value.replace(/\D/g, "").replace(/^0+/, "");
  if (!digits) return "";
  const numeric = Number(digits);
  if (!Number.isFinite(numeric) || numeric <= 0) return "";
  return String(Math.min(numeric, max));
}

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
    position.startsWith("NECK_") ? { position } : { position, colourCount: 1 },
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
