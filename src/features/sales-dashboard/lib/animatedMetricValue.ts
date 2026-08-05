export type AnimatedMetricFormat = "currency" | "number" | "percent";

const fractionDigitFallback = (format: AnimatedMetricFormat) => format === "currency" ? 2 : format === "percent" ? 1 : 0;

export function normalizeFractionDigits(format: AnimatedMetricFormat, value?: number | null) {
  if (value === undefined || value === null || !Number.isFinite(value)) return fractionDigitFallback(format);
  return Math.min(20, Math.max(0, Math.trunc(value)));
}

export function formatAnimatedMetricValue(value: number | null | undefined, format: AnimatedMetricFormat, maximumFractionDigits?: number, minimumFractionDigits?: number) {
  if (value === null || value === undefined || !Number.isFinite(value)) return "—";
  const maxDigits = normalizeFractionDigits(format, maximumFractionDigits);
  if (format === "currency") {
    const requestedMinimum = normalizeFractionDigits(format, minimumFractionDigits);
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
      maximumFractionDigits: maxDigits,
      minimumFractionDigits: Math.min(requestedMinimum, maxDigits),
    }).format(value);
  }
  if (format === "percent") return `${value.toFixed(maxDigits)}%`;
  const requestedMinimum = normalizeFractionDigits(format, minimumFractionDigits);
  return new Intl.NumberFormat("en-GB", {
    maximumFractionDigits: maxDigits,
    minimumFractionDigits: Math.min(requestedMinimum, maxDigits),
  }).format(value);
}

export function getAccessibleMetricText(value: number | null | undefined, format: AnimatedMetricFormat, maximumFractionDigits?: number, minimumFractionDigits?: number) {
  return formatAnimatedMetricValue(value, format, maximumFractionDigits, minimumFractionDigits);
}

export function shouldAnimateMetricValue(from: number | null, to: number | null, reduceMotion: boolean) {
  return !reduceMotion && to !== null && Number.isFinite(to) && from !== to;
}
