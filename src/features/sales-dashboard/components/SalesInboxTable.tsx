import type { DashboardMonth, SalesInboxYearData } from "../types";

type SalesInboxTableProps = {
  data: SalesInboxYearData | null;
  month: DashboardMonth;
};

export function SalesInboxTable({ data, month }: SalesInboxTableProps) {
  const index = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].indexOf(month);
  const value = data ? {
    enquiries: data.enquiries[index],
    conversions: data.conversions[index],
    conversionRate: data.conversionRates[index],
  } : null;

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <Metric label="Enquiries" value={value?.enquiries} />
      <Metric label="Converted" value={value?.conversions} />
      <Metric label="Conversion rate" value={value?.conversionRate} suffix="%" />
    </div>
  );
}

function Metric({ label, value, suffix = "" }: { label: string; value: number | null | undefined; suffix?: string }) {
  return <div className="rounded-md border border-border/70 bg-background/55 p-3 backdrop-blur-sm"><div className="text-xs text-muted-foreground">{label}</div><div className="mt-1 text-lg font-semibold tabular-nums text-foreground">{value == null ? "—" : `${value.toLocaleString("en-GB")}${suffix}`}</div></div>;
}
