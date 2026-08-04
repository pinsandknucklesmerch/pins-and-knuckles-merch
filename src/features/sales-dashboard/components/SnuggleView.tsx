"use client";

import type { CSSProperties } from "react";
import { useState } from "react";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { ActionButton } from "@/components/ui/ActionButton";
import { copyText } from "@/components/ui/copyText";
import { KpiCard } from "metricui";
import type { SnuggleProfitData, SnuggleMonth } from "../server/snuggleProfit";
import { formatSnuggleDiagnostics, groupUnmappedSnuggleWarnings } from "../lib/snuggleDiagnostics";
import { resolveSelectedSnuggleMonth } from "../lib/snuggleChart";
import { SnuggleMonthlyChart } from "./SnuggleMonthlyChart";

const monthName = (value: SnuggleMonth) => new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(Date.UTC(value.year, value.month - 1, 1)));
function WarningSummary({ data, tvMode, isAdmin }: { data: SnuggleProfitData; tvMode?: boolean; isAdmin?: boolean }) {
  const [copied, setCopied] = useState(false);
  if (!data.warnings.length) return null;
  const counts = new Map<string, number>();
  for (const warning of data.warnings) counts.set(warning.kind, (counts.get(warning.kind) ?? 0) + 1);
  const labels = (["invalid-profit", "unassigned", "unmapped", "multi-assignee"] as const).flatMap((kind) => counts.has(kind) ? [`${counts.get(kind)} ${kind === "invalid-profit" ? "invalid Profit" : kind === "multi-assignee" ? "multi-assignee" : kind}`] : []);
  const unmapped = groupUnmappedSnuggleWarnings(data.warnings);
  const copyDiagnostics = async () => { if (await copyText(formatSnuggleDiagnostics(data.warnings))) { setCopied(true); window.setTimeout(() => setCopied(false), 1500); } };
  return <div className="grid gap-2">
    <p role="status" data-tv-group={tvMode ? "snuggle-warning" : undefined} style={tvMode ? { "--tv-enter-index": 2 } as CSSProperties : undefined} className="rounded-md border border-amber-400/30 bg-amber-400/10 px-3 py-2 text-sm text-amber-100">Data quality: {labels.join(" · ")}. Affected items are excluded from member attribution where ownership is unclear.</p>
    {isAdmin ? <details className="rounded-md border border-border bg-card/40 px-3 py-2 text-sm">
      <summary className="cursor-pointer font-medium text-foreground">Admin diagnostics</summary>
      <div className="mt-3 grid gap-3 text-muted-foreground">
        <div className="flex flex-wrap items-center justify-between gap-2"><span>Unmapped members</span><ActionButton type="button" onClick={copyDiagnostics}>{copied ? "Copied" : "Copy diagnostics"}</ActionButton></div>
        {unmapped.length ? <div className="grid gap-2">{unmapped.map((group) => <details key={group.personId} className="min-w-0 rounded border border-border/70 p-2"><summary className="cursor-pointer text-foreground">{group.personName} · {group.personId} · {group.itemCount} item{group.itemCount === 1 ? "" : "s"}</summary><div className="mt-2 grid gap-1 text-xs"><div>Completed months: {group.months.join(", ")}</div><div>Groups: {group.groups.join(", ")}</div>{group.items.map((item) => <div key={item.itemId} className="min-w-0 break-words">{item.itemId} · {item.itemName} · {item.group} · {item.resolvedYear && item.resolvedMonth ? `${item.resolvedYear}-${String(item.resolvedMonth).padStart(2, "0")}` : "Unknown month"}</div>)}</div></details>)}</div> : <span>No unmapped members.</span>}
        <details><summary className="cursor-pointer text-foreground">Unassigned items ({data.warnings.filter((warning) => warning.kind === "unassigned").length})</summary><div className="mt-2 grid gap-1 text-xs">{data.warnings.filter((warning) => warning.kind === "unassigned").map((item) => <div key={item.itemId} className="break-words">{item.itemId} · {item.itemName} · {item.group}</div>)}</div></details>
        <details><summary className="cursor-pointer text-foreground">Multi-assignee items ({data.warnings.filter((warning) => warning.kind === "multi-assignee").length})</summary><div className="mt-2 grid gap-1 text-xs">{data.warnings.filter((warning) => warning.kind === "multi-assignee").map((item) => <div key={item.itemId} className="break-words">{item.itemId} · {item.itemName} · {item.group} · {item.assignedPeople?.map((person) => `${person.name} (${person.id})`).join(", ")}</div>)}</div></details>
      </div>
    </details> : null}
  </div>;
}

export function SnuggleView({ data, year, month, tvMode = false, isAdmin = false }: { data: SnuggleProfitData; year: number; month: number; tvMode?: boolean; isAdmin?: boolean }) {
  if (data.error) return <ErrorState title="Snuggle data unavailable" message={data.error} />;
  const history = data.months;
  const selected = resolveSelectedSnuggleMonth(history, year, month);
  return <div className="grid gap-3" data-tv-view={tvMode ? "snuggle" : undefined}>
    <WarningSummary data={data} tvMode={tvMode} isAdmin={isAdmin} />
    {!history.length ? <EmptyState title="No completed Snuggle profit" /> : <>
      <div data-tv-group={tvMode ? "snuggle-summary" : undefined} style={tvMode ? { "--tv-enter-index": 0 } as CSSProperties : undefined}>
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
      <SnuggleMonthlyChart months={history} />
    </>}
  </div>;
}
