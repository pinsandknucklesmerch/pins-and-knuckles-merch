import { useId } from "react";
import styles from "./YtdComparisonCharts.module.css";

export type YtdChartFormat = "currency" | "number" | "percent";
export type YtdChartPoint = { label: string; current: number | null; previous: number | null };

type ChartBox = { width: number; height: number; left: number; right: number; top: number; bottom: number };

const MONTH_INITIALS = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];
const NICE_STEPS = [1, 1.5, 2, 2.5, 5, 10];

function finiteValues(points: YtdChartPoint[]) {
  return points.flatMap((point) => [point.current, point.previous]).filter((value): value is number => value !== null && Number.isFinite(value));
}

function scaleMaximum(points: YtdChartPoint[], intervals = 4) {
  const maximum = Math.max(0, ...finiteValues(points));
  if (maximum <= 0) return 1;
  const rawStep = maximum / intervals;
  const magnitude = 10 ** Math.floor(Math.log10(rawStep));
  const normalised = rawStep / magnitude;
  const step = (NICE_STEPS.find((candidate) => candidate >= normalised) ?? 10) * magnitude;
  return step * intervals;
}

function formatAxisValue(value: number, format: YtdChartFormat) {
  if (format === "percent") return `${Math.round(value)}%`;
  if (format === "currency") {
    if (Math.abs(value) >= 1_000_000) return `£${(value / 1_000_000).toFixed(value % 1_000_000 === 0 ? 0 : 1)}m`;
    if (Math.abs(value) >= 1_000) return `£${Math.round(value / 1_000)}k`;
    return `£${Math.round(value)}`;
  }
  if (Math.abs(value) >= 1_000_000) return `${(value / 1_000_000).toFixed(value % 1_000_000 === 0 ? 0 : 1)}m`;
  if (Math.abs(value) >= 1_000) return `${(value / 1_000).toFixed(value % 1_000 === 0 ? 0 : 1)}k`;
  return Math.round(value).toLocaleString("en-GB");
}

function plotGeometry(box: ChartBox, maximum: number) {
  const plotWidth = box.width - box.left - box.right;
  const plotHeight = box.height - box.top - box.bottom;
  const xLine = (index: number) => box.left + (plotWidth / 11) * index;
  const xBand = (index: number) => box.left + (plotWidth / 12) * (index + 0.5);
  const y = (value: number) => box.top + plotHeight - (Math.max(0, value) / maximum) * plotHeight;
  return { plotWidth, plotHeight, xLine, xBand, y, baseline: box.top + plotHeight };
}

function contiguousPaths(values: Array<number | null>, x: (index: number) => number, y: (value: number) => number) {
  const paths: string[] = [];
  let segment: Array<{ x: number; y: number }> = [];
  const flush = () => {
    if (!segment.length) return;
    if (segment.length === 1) {
      paths.push(`M ${segment[0].x.toFixed(2)} ${segment[0].y.toFixed(2)}`);
    } else {
      let path = `M ${segment[0].x.toFixed(2)} ${segment[0].y.toFixed(2)}`;
      for (let index = 0; index < segment.length - 1; index += 1) {
        const previous = segment[index - 1] ?? segment[index];
        const current = segment[index];
        const next = segment[index + 1];
        const after = segment[index + 2] ?? next;
        const controlOne = { x: current.x + (next.x - previous.x) / 6, y: current.y + (next.y - previous.y) / 6 };
        const controlTwo = { x: next.x - (after.x - current.x) / 6, y: next.y - (after.y - current.y) / 6 };
        path += ` C ${controlOne.x.toFixed(2)} ${controlOne.y.toFixed(2)}, ${controlTwo.x.toFixed(2)} ${controlTwo.y.toFixed(2)}, ${next.x.toFixed(2)} ${next.y.toFixed(2)}`;
      }
      paths.push(path);
    }
    segment = [];
  };
  values.forEach((value, index) => {
    if (value === null || !Number.isFinite(value)) {
      flush();
      return;
    }
    segment.push({ x: x(index), y: y(value) });
  });
  flush();
  return paths;
}

function GridAndAxes({ points, format, box, maximum, compact = false }: { points: YtdChartPoint[]; format: YtdChartFormat; box: ChartBox; maximum: number; compact?: boolean }) {
  const geometry = plotGeometry(box, maximum);
  const intervals = 4;
  return <>
    {Array.from({ length: intervals + 1 }, (_, index) => {
      const value = (maximum / intervals) * index;
      const y = geometry.y(value);
      return <g key={value}>
        <line className={index === 0 ? styles.baseline : styles.gridLine} x1={box.left} x2={box.width - box.right} y1={y} y2={y} />
        <text className={styles.axisLabel} x={box.left - 7} y={y + 3} textAnchor="end">{formatAxisValue(value, format)}</text>
      </g>;
    })}
    {points.map((point, index) => <text key={point.label} className={styles.monthLabel} x={compact ? geometry.xBand(index) : geometry.xLine(index)} y={box.height - 7}>{compact ? MONTH_INITIALS[index] : point.label}</text>)}
  </>;
}

export function YtdProfitAreaChart({ points, label }: { points: YtdChartPoint[]; label: string }) {
  const gradientId = useId().replace(/:/g, "");
  const box: ChartBox = { width: 760, height: 238, left: 62, right: 18, top: 12, bottom: 32 };
  const maximum = scaleMaximum(points, 4);
  const geometry = plotGeometry(box, maximum);
  const currentValues = points.map((point) => point.current);
  const previousValues = points.map((point) => point.previous);
  const currentPaths = contiguousPaths(currentValues, geometry.xLine, geometry.y);
  const previousPaths = contiguousPaths(previousValues, geometry.xLine, geometry.y);
  const firstCurrent = currentValues.findIndex((value) => value !== null && Number.isFinite(value));
  let lastCurrent = -1;
  currentValues.forEach((value, index) => { if (value !== null && Number.isFinite(value)) lastCurrent = index; });
  const areaPath = currentPaths.length === 1 && firstCurrent >= 0 && lastCurrent >= firstCurrent
    ? `${currentPaths[0]} L ${geometry.xLine(lastCurrent)} ${geometry.baseline} L ${geometry.xLine(firstCurrent)} ${geometry.baseline} Z`
    : null;

  return <svg className={styles.chart} viewBox={`0 0 ${box.width} ${box.height}`} role="img" aria-label={label} preserveAspectRatio="none">
    <defs><linearGradient id={gradientId} x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#ef4448" stopOpacity="0.3" /><stop offset="1" stopColor="#ef4448" stopOpacity="0.04" /></linearGradient></defs>
    <GridAndAxes points={points} format="currency" box={box} maximum={maximum} />
    {areaPath ? <path d={areaPath} fill={`url(#${gradientId})`} /> : null}
    {previousPaths.map((path, index) => <path key={`previous-${index}`} className={styles.previousLine} d={path} />)}
    {currentPaths.map((path, index) => <path key={`current-${index}`} className={styles.currentLine} d={path} />)}
    {points.map((point, index) => point.previous === null ? null : <circle key={`previous-${point.label}`} className={styles.previousPoint} cx={geometry.xLine(index)} cy={geometry.y(point.previous)} r="3" />)}
    {points.map((point, index) => point.current === null ? null : <circle key={`current-${point.label}`} className={styles.currentPoint} cx={geometry.xLine(index)} cy={geometry.y(point.current)} r="3.25" />)}
  </svg>;
}

export function YtdBarComparisonChart({ points, format, label }: { points: YtdChartPoint[]; format: Exclude<YtdChartFormat, "percent">; label: string }) {
  const box: ChartBox = { width: 270, height: 154, left: 36, right: 6, top: 8, bottom: 24 };
  const maximum = scaleMaximum(points, 4);
  const geometry = plotGeometry(box, maximum);
  const step = geometry.plotWidth / 12;
  const barWidth = Math.max(3, step * 0.27);
  return <svg className={styles.chart} viewBox={`0 0 ${box.width} ${box.height}`} role="img" aria-label={label} preserveAspectRatio="none">
    <GridAndAxes points={points} format={format} box={box} maximum={maximum} compact />
    {points.map((point, index) => {
      const centre = geometry.xBand(index);
      return <g key={point.label}>
        {point.current === null ? null : <rect className={styles.currentBar} x={centre - barWidth - 1} y={geometry.y(point.current)} width={barWidth} height={Math.max(0, geometry.baseline - geometry.y(point.current))} rx="1" />}
        {point.previous === null ? null : <rect className={styles.previousBar} x={centre + 1} y={geometry.y(point.previous)} width={barWidth} height={Math.max(0, geometry.baseline - geometry.y(point.previous))} rx="1" />}
      </g>;
    })}
  </svg>;
}

export function YtdRateComparisonChart({ points, label }: { points: YtdChartPoint[]; label: string }) {
  const box: ChartBox = { width: 270, height: 154, left: 36, right: 6, top: 8, bottom: 24 };
  const maximum = Math.max(10, scaleMaximum(points, 4));
  const geometry = plotGeometry(box, maximum);
  const currentPaths = contiguousPaths(points.map((point) => point.current), geometry.xBand, geometry.y);
  const previousPaths = contiguousPaths(points.map((point) => point.previous), geometry.xBand, geometry.y);
  return <svg className={styles.chart} viewBox={`0 0 ${box.width} ${box.height}`} role="img" aria-label={label} preserveAspectRatio="none">
    <GridAndAxes points={points} format="percent" box={box} maximum={maximum} compact />
    {previousPaths.map((path, index) => <path key={`previous-${index}`} className={styles.previousLine} d={path} />)}
    {currentPaths.map((path, index) => <path key={`current-${index}`} className={styles.currentLine} d={path} />)}
    {points.map((point, index) => point.previous === null ? null : <circle key={`previous-${point.label}`} className={styles.previousPoint} cx={geometry.xBand(index)} cy={geometry.y(point.previous)} r="2.5" />)}
    {points.map((point, index) => point.current === null ? null : <circle key={`current-${point.label}`} className={styles.currentPoint} cx={geometry.xBand(index)} cy={geometry.y(point.current)} r="2.75" />)}
  </svg>;
}
