export type AnimatedMetricFormat = "currency" | "number" | "percent";

export function formatAnimatedMetricValue(value: number, format: AnimatedMetricFormat, maximumFractionDigits?: number, minimumFractionDigits?: number) {
  if (format === "currency") {
    return new Intl.NumberFormat("en-GB", {
      style: "currency",
      currency: "GBP",
      maximumFractionDigits: maximumFractionDigits ?? 0,
      minimumFractionDigits: minimumFractionDigits ?? 0,
    }).format(value);
  }
  if (format === "percent") return `${value.toFixed(maximumFractionDigits ?? 1)}%`;
  return new Intl.NumberFormat("en-GB", {
    maximumFractionDigits: maximumFractionDigits ?? 0,
    minimumFractionDigits: minimumFractionDigits ?? 0,
  }).format(value);
}

export function getAccessibleMetricText(value: number | null, format: AnimatedMetricFormat, maximumFractionDigits?: number, minimumFractionDigits?: number) {
  return value === null || !Number.isFinite(value) ? "—" : formatAnimatedMetricValue(value, format, maximumFractionDigits, minimumFractionDigits);
}

export function shouldAnimateMetricValue(from: number | null, to: number | null, reduceMotion: boolean) {
  return !reduceMotion && to !== null && Number.isFinite(to) && from !== to;
}
