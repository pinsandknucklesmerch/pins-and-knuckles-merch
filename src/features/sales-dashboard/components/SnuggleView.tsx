"use client";

import type { CSSProperties } from "react";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { KpiCard } from "metricui";
import type { SnuggleProfitData, SnuggleMonth } from "../server/snuggleProfit";
import { resolveSelectedSnuggleMonth } from "../lib/snuggleChart";
import { SnuggleMonthlyChart } from "./SnuggleMonthlyChart";

const monthName = (value: SnuggleMonth) => new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(Date.UTC(value.year, value.month - 1, 1)));
function WarningSummary({ data, tvMode }: { data: SnuggleProfitData; tvMode?: boolean }) {
  if (!data.warnings.length) return null;
  const counts = new Map<string, number>();
  for (const warning of data.warnings) counts.set(warning.kind, (counts.get(warning.kind) ?? 0) + 1);
  return <p role="status" data-tv-group={tvMode ? "snuggle-warning" : undefined} style={tvMode ? { "--tv-enter-index": 2 } as CSSProperties : undefined} className="rounded-md border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-sm text-amber-100">Data quality issues are affecting member attribution. Some items have been excluded.</p>;
}

export function SnuggleView({ data, year, month, tvMode = false }: { data: SnuggleProfitData; year: number; month: number; tvMode?: boolean; isAdmin?: boolean }) {
  if (data.error) return <ErrorState title="Snuggle data unavailable" message={data.error} />;
  const history = data.months;
  const selected = resolveSelectedSnuggleMonth(history, year, month);
  return <div className="grid gap-3" data-tv-view={tvMode ? "snuggle" : undefined}>
    <WarningSummary data={data} tvMode={tvMode} />
    {!history.length ? <EmptyState title="No completed Snuggle profit" /> : <>
      <div data-tv-group={tvMode ? "snuggle-summary" : undefined} data-tv-kpi={tvMode ? "true" : undefined} style={tvMode ? { "--tv-enter-index": 0 } as CSSProperties : undefined}>
        <KpiCard
          title={monthName({ year, month, total: 0 })}
          value={selected?.total ?? null}
          format={{ style: "currency", currency: "GBP", compact: false, precision: 0 }}
          description="Snuggle profit"
          animate={{ countUp: true, duration: 700 }}
          nullDisplay="dash"
          className="min-h-[7.25rem]"
        />
      </div>
      <SnuggleMonthlyChart months={history} tvMode={tvMode} />
    </>}
  </div>;
}
