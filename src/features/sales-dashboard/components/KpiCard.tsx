type KpiCardProps = {
  label: string;
  value: string;
};

export function KpiCard({ label, value }: KpiCardProps) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="mt-2 text-2xl font-semibold tracking-normal text-foreground">
        {value}
      </dd>
    </div>
  );
}
