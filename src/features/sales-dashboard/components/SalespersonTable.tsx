import type { SalespersonKpi } from "../types";

type SalespersonTableProps = {
  rows: SalespersonKpi[];
};

function formatPercent(value: number) {
  return `${value.toFixed(1)}%`;
}

function formatCurrency(value: number | null | undefined) {
  return value == null ? "—" : new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(value);
}

export function SalespersonTable({ rows }: SalespersonTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs text-muted-foreground">
            <th className="py-2 pr-3 font-medium">Salesperson</th>
            <th className="px-3 py-2 text-right font-medium">Leads</th>
            <th className="px-3 py-2 text-right font-medium">Conversions</th>
            <th className="py-2 pl-3 text-right font-medium">Rate</th>
            <th className="px-3 py-2 text-right font-medium">Profit</th>
            <th className="py-2 pl-3 text-right font-medium">Avg/job</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.salespersonId} className="border-b border-border/70">
              <td className="py-2 pr-3 font-medium text-foreground">
                {row.salespersonName}
              </td>
              <td className="px-3 py-2 text-right text-muted-foreground">
                {row.leads}
              </td>
              <td className="px-3 py-2 text-right text-muted-foreground">
                {row.conversions}
              </td>
              <td className="py-2 pl-3 text-right text-foreground">
                {formatPercent(row.conversionRate)}
              </td>
              <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">{formatCurrency(row.totalProfit)}</td>
              <td className="py-2 pl-3 text-right tabular-nums text-foreground">{formatCurrency(row.averageProfitPerJob)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
