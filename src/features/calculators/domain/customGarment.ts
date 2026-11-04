import type { EuCalculatorItemInput, Garment, UkTradeCustomGarmentColour, UkTradeItemInput } from "./types.ts";

export const CUSTOM_GARMENT_ID = "__custom_garment__";

export const CUSTOM_GARMENT_OPTION: Garment = {
  id: CUSTOM_GARMENT_ID,
  code: "",
  altCode: "",
  brandName: "",
  name: "Custom Garment",
  colour: "",
  garmentType: "OTHER",
  eurBasePrice: null,
  gbpPrice: null,
  extraSizeCost: null,
  tags: "custom garment",
};

export function isCustomGarmentId(garmentId: string | null) {
  return garmentId === CUSTOM_GARMENT_ID;
}

export function isUkTradeCustomGarmentColour(
  colour: UkTradeCustomGarmentColour | undefined,
): colour is UkTradeCustomGarmentColour {
  return colour === "WHITE" || colour === "COLOURED";
}

export function resolveEuGarment(
  item: EuCalculatorItemInput,
  garments: Garment[],
) {
  if (isCustomGarmentId(item.garmentId)) {
    const unitCost = item.customGarmentUnitCost;
    return typeof unitCost === "number" && Number.isFinite(unitCost) && unitCost >= 0
      ? { ...CUSTOM_GARMENT_OPTION, eurBasePrice: unitCost }
      : undefined;
  }

  return item.garmentId
    ? garments.find((garment) => garment.id === item.garmentId)
    : undefined;
}

export function resolveUkTradeGarment(
  item: UkTradeItemInput,
  garments: Garment[],
) {
  if (isCustomGarmentId(item.garmentId)) {
    const unitCost = item.customGarmentUnitCost;
    if (
      typeof unitCost !== "number" ||
      !Number.isFinite(unitCost) ||
      unitCost < 0 ||
      !isUkTradeCustomGarmentColour(item.customGarmentColour)
    ) {
      return undefined;
    }

    return {
      ...CUSTOM_GARMENT_OPTION,
      colour: item.customGarmentColour === "WHITE" ? "White" : "Colours",
      gbpPrice: unitCost,
    };
  }

  return item.garmentId
    ? garments.find((garment) => garment.id === item.garmentId)
    : undefined;
}
