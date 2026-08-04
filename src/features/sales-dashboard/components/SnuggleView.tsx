"use client";

import type { CSSProperties } from "react";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { Panel } from "@/components/ui/Panel";
import { Surface } from "@/components/ui/Surface";
import type { SnuggleProfitData, SnuggleMonth } from "../server/snuggleProfit";
import { SnuggleMonthlyChart } from "./SnuggleMonthlyChart";

const money = (value: number) => new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(value);
const monthName = (value: SnuggleMonth) => new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(Date.UTC(value.year, value.month - 1, 1)));

function WarningSummary({ data, tvMode }: { data: SnuggleProfitData; tvMode?: boolean }) {
  if (!data.warnings.length) return null;
  const counts = new Map<string, number>();
  for (const warning of data.warnings) counts.set(warning.kind, (counts.get(warning.kind) ?? 0) + 1);
  const labels = (["invalid-profit", "unassigned", "unmapped", "multi-assignee"] as const).flatMap((kind) => counts.has(kind) ? [`${counts.get(kind)} ${kind === "invalid-profit" ? "invalid Profit" : kind === "multi-assignee" ? "multi-assignee" : kind}`] : []);
  return <p role="status" data-tv-group={tvMode ? "snuggle-warning" : undefined} style={tvMode ? { "--tv-enter-index": 2 } as CSSProperties : undefined} className="rounded-md border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-sm text-amber-100">Data quality: {labels.join(" · ")}. Affected items are excluded from member attribution where ownership is unclear.</p>;
}

export function SnuggleView({ data, year, month, tvMode = false }: { data: SnuggleProfitData; year: number; month: number; tvMode?: boolean }) {
  if (data.error) return <ErrorState title="Snuggle data unavailable" message={data.error} />;
  const history = data.months;
  const selected = history.find((candidate) => candidate.year === year && candidate.month === month) ?? history[0] ?? null;
  return <div className="grid gap-3" data-tv-view={tvMode ? "snuggle" : undefined}>
    <WarningSummary data={data} tvMode={tvMode} />
    {!history.length ? <EmptyState title="No completed Snuggle profit" /> : <>
      <Surface variant="metric" data-tv-group={tvMode ? "snuggle-summary" : undefined} style={tvMode ? { "--tv-enter-index": 0 } as CSSProperties : undefined}>
        <dl>
          <dt className="text-sm font-medium text-muted-foreground">{selected ? monthName(selected) : "Snuggle"}</dt>
          <dd className="mt-2 text-2xl font-semibold tracking-normal text-foreground tabular-nums">{selected ? money(selected.total) : "—"}</dd>
          <dd className="mt-1 text-xs text-muted-foreground">Company total</dd>
        </dl>
      </Surface>
      <SnuggleMonthlyChart months={history} />
      <Panel title="Monthly Snuggle profit" tvGroup={tvMode ? "snuggle-table" : undefined}>
        <div className="overflow-x-auto"><table className="w-full min-w-[20rem] text-sm"><thead><tr className="border-b border-border text-left text-xs text-muted-foreground"><th className="py-2 pr-3 font-medium">Month</th><th className="py-2 pl-3 text-right font-medium">Profit</th></tr></thead><tbody>{history.map((entry) => <tr key={`${entry.year}-${entry.month}`} className="border-b border-border/70 transition-colors hover:bg-secondary/40 focus-within:bg-secondary/40"><td className="py-2 pr-3 font-medium text-foreground">{monthName(entry)}</td><td className="py-2 pl-3 text-right tabular-nums text-foreground">{money(entry.total)}</td></tr>)}</tbody></table></div>
      </Panel>
    </>}
  </div>;
}
