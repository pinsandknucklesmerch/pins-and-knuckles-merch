import type { LeadSourceKpi } from "../types";

type LeadSourceTableProps = {
  rows: LeadSourceKpi[];
};

function formatPercent(value: number) {
  return `${value.toFixed(1)}%`;
}

export function LeadSourceTable({ rows }: LeadSourceTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[460px] text-sm">
        <thead>
          <tr className="border-b border-border text-left text-xs text-muted-foreground">
            <th className="py-2 pr-3 font-medium">Source</th>
            <th className="px-3 py-2 text-right font-medium">Leads</th>
            <th className="px-3 py-2 text-right font-medium">Conversions</th>
            <th className="py-2 pl-3 text-right font-medium">Rate</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.sourceCategory} className="border-b border-border/70">
              <td className="py-2 pr-3 font-medium text-foreground">
                {row.sourceCategory}
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
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
