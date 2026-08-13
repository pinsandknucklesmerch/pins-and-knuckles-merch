import type { SalesDashboardStaleWarning as Warning } from "../lib/cronRunStatus";

export function SalesDashboardStaleWarning({ warnings }: { warnings: Warning[] }) {
  if (!warnings.length) return null;
  return <div role="alert" className="border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive">
    {warnings.map((warning) => <p key={warning.jobName}>{warning.message}</p>)}
  </div>;
}
