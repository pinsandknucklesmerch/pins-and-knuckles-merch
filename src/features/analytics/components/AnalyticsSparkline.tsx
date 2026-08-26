import { useId } from "react";

type AnalyticsSparklineProps = { label: string; values: number[] };

export function AnalyticsSparkline({ label, values }: AnalyticsSparklineProps) {
  const gradientId = useId().replace(/:/g, "");
  const width = 220;
  const height = 46;
  const maximum = Math.max(1, ...values);
  const minimum = Math.min(0, ...values);
  const range = Math.max(1, maximum - minimum);
  const points = values.map((value, index) => ({
    x: values.length <= 1 ? width / 2 : (index / (values.length - 1)) * width,
    y: 4 + ((maximum - value) / range) * (height - 10),
  }));
  const line = points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`).join(" ");
  const area = points.length ? `${line} L ${points[points.length - 1].x.toFixed(2)} ${height} L ${points[0].x.toFixed(2)} ${height} Z` : "";

  return <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" role="img" aria-label={`${label} daily trend`}>
    <defs><linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="currentColor" stopOpacity="0.24" /><stop offset="1" stopColor="currentColor" stopOpacity="0" /></linearGradient></defs>
    {area ? <path d={area} fill={`url(#${gradientId})`} /> : null}
    {line ? <path d={line} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" /> : null}
  </svg>;
}
