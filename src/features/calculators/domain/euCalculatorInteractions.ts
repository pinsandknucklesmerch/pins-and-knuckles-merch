export const EU_PRINT_COLOUR_MAX = 9;

export function normaliseEuPrintColourInput(value: string, max = EU_PRINT_COLOUR_MAX) {
  const digits = value.replace(/\D/g, "").replace(/^0+/, "");
  if (!digits) return "";
  const parsed = Number(digits);
  if (!Number.isFinite(parsed) || parsed <= 0) return "";
  return String(Math.min(parsed, max));
}

export function normaliseEuPkMarkupInput(value: string) {
  let result = "";
  let hasDecimal = false;
  for (const [index, character] of [...value].entries()) {
    if (/\d/.test(character)) result += character;
    else if (character === "-" && index === 0 && result === "") result = "-";
    else if (character === "." && !hasDecimal) {
      result += ".";
      hasDecimal = true;
    }
  }
  return result;
}

export function shouldShowMissingGarmentError({
  garmentId,
  attemptedAddItem = false,
  attemptedPrintSelection = false,
}: {
  garmentId: string | null;
  attemptedAddItem?: boolean;
  attemptedPrintSelection?: boolean;
}) {
  return !garmentId && (attemptedAddItem || attemptedPrintSelection);
}
