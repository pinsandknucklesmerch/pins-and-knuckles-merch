export const EU_PRINT_COLOUR_MAX = 9;

export function normaliseEuPrintColourInput(value: string): number | null {
  if (value.trim() === "") return null;

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;

  return Math.min(parsed, EU_PRINT_COLOUR_MAX);
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
