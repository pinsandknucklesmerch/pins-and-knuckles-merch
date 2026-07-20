type KpiMeterProps = {
  value: number;
  label: string;
};

export function KpiMeter({ value, label }: KpiMeterProps) {
  const width = Math.min(Math.max(value, 0), 100);

  return (
    <div className="grid gap-1.5">
      <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
        <span>Progress</span>
        <span className="tabular-nums">{label}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-secondary" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={width}>
        <div className="h-full rounded-full bg-primary transition-[width] duration-200" style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}
