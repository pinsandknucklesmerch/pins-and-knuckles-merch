/**
 * Converts untrusted chart input to a finite value or a missing point.
 * Chart consumers use null with `chartNullMode="gap"`; zero remains a real
 * plotted value and must not be treated as missing.
 */
export function chartValue(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}
