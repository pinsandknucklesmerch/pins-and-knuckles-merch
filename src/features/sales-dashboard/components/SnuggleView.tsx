"use client";

import type { CSSProperties } from "react";
import { EmptyState } from "@/components/ui/EmptyState";
import { Panel } from "@/components/ui/Panel";
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

export function SnuggleView({ data, year, month, view, member, tvMode = false }: { data: SnuggleProfitData; year: number; month: number; view: "company" | "members"; member?: string; tvMode?: boolean }) {
  if (data.error) return <p role="alert" className="text-sm text-destructive">{data.error}</p>;
  const selectedMember = view === "members" ? data.members.find((candidate) => candidate.memberKey === member) : null;
  const history = selectedMember?.months ?? data.months;
  const selected = history.find((candidate) => candidate.year === year && candidate.month === month) ?? history[0] ?? null;
  return <div className="grid gap-3" data-tv-view={tvMode ? "snuggle" : undefined}>
    <WarningSummary data={data} tvMode={tvMode} />
    {!history.length ? <EmptyState title="No completed Snuggle profit" /> : <>
      <Panel title={selected ? monthName(selected) : "Snuggle"} tvGroup={tvMode ? "snuggle-summary" : undefined}>
        <div className="text-2xl font-semibold tabular-nums">{selected ? money(selected.total) : "—"}</div>
        <p className="mt-1 text-xs text-muted-foreground">{view === "members" ? selectedMember?.memberKey ?? "Selected team member" : "Company total"}</p>
      </Panel>
      <SnuggleMonthlyChart months={history} />
      <Panel title="Monthly Snuggle profit" tvGroup={tvMode ? "snuggle-table" : undefined}>
        <div className="overflow-x-auto"><table className="w-full min-w-[20rem] text-sm"><thead><tr className="border-b border-border text-left text-xs text-muted-foreground"><th className="px-2 py-2 font-medium">Month</th><th className="px-2 py-2 text-right font-medium">Profit</th></tr></thead><tbody>{history.map((entry) => <tr key={`${entry.year}-${entry.month}`} className="border-b border-border/70"><td className="px-2 py-2">{monthName(entry)}</td><td className="px-2 py-2 text-right tabular-nums">{money(entry.total)}</td></tr>)}</tbody></table></div>
      </Panel>
    </>}
  </div>;
}
