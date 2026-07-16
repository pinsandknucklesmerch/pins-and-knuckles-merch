import {
  EU_PRINT_COLOUR_MAX,
  EU_PRINT_COLOUR_MIN,
  EU_QUANTITY_MAX,
  EU_QUANTITY_MIN,
} from "./profiles.ts";
import type {
  CalculatorValidationError,
  EuCalculatorItemInput,
  EuPrintSelection,
} from "./types.ts";

export function validateEuQuantity(
  item: EuCalculatorItemInput,
): CalculatorValidationError | null {
  if (item.quantity >= EU_QUANTITY_MIN && item.quantity <= EU_QUANTITY_MAX) {
    return null;
  }

  return {
    code: "INVALID_QUANTITY",
    itemId: item.id,
    field: "quantity",
    message: `EU calculator quantity must be between ${EU_QUANTITY_MIN} and ${EU_QUANTITY_MAX}.`,
  };
}

export function validateEuPrintColour(
  item: EuCalculatorItemInput,
  print: EuPrintSelection,
): CalculatorValidationError | null {
  if (print.position === "NECK") {
    return null;
  }

  const colourCount = print.colourCount;
  if (
    typeof colourCount === "number" &&
    Number.isInteger(colourCount) &&
    colourCount >= EU_PRINT_COLOUR_MIN &&
    colourCount <= EU_PRINT_COLOUR_MAX
  ) {
    return null;
  }

  return {
    code: "INVALID_PRINT_COLOUR_COUNT",
    itemId: item.id,
    field: `printPositions.${print.position}.colourCount`,
    message: `EU print colours must be between ${EU_PRINT_COLOUR_MIN} and ${EU_PRINT_COLOUR_MAX}.`,
  };
}
