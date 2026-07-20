import type { EuCalculatorItemInput } from "./types.ts";

export function createDefaultEuCalculatorItem(index: number): EuCalculatorItemInput {
  return {
    id: `item-${index}`,
    itemLabel: "",
    garmentId: null,
    quantity: 50,
    printPositions: [{ position: "FRONT", colourCount: 1 }],
    embroideryItems: [],
    pkMarkupEnabled: false,
    pkMarkupPerUnit: 0,
  };
}
