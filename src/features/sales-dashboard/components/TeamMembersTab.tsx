"use client";

import { useEffect, useMemo, useState } from "react";
import { EmptyState } from "@/components/ui/EmptyState";
import { Panel } from "@/components/ui/Panel";
import type { MemberDashboardRow, SalesDashboardData } from "../domain/types";
import { getMemberSnuggleProfit, getVisibleTeamMembers } from "../lib/teamMembersTab";
import { DASHBOARD_MONTHS } from "../types";

type MetricFormat = "currency" | "number" | "percent";
type Metric = { label: string; value: number | null; format: MetricFormat };

const money = (value: number | null) => value === null ? "—" : new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(value);
const number = (value: number | null) => value === null ? "—" : value.toLocaleString("en-GB");
const percent = (value: number | null) => value === null ? "—" : `${value.toFixed(1)}%`;
const formatValue = (value: number | null, format: MetricFormat) => format === "currency" ? money(value) : format === "percent" ? percent(value) : number(value);

function memberMetrics(row: MemberDashboardRow, snuggleProfit: number | null): Metric[] {
  return [
    { label: "Profit", value: row.profit, format: "currency" },
    { label: "Snuggle Profit", value: snuggleProfit, format: "currency" },
    { label: "PK Tax", value: row.pkTax, format: "currency" },
    { label: "Quotes Done", value: row.quotesDone, format: "number" },
    { label: "Orders Processed", value: row.ordersProcessed, format: "number" },
  ];
}

function MetricGrid({ metrics }: { metrics: Metric[] }) {
  return <dl className="grid grid-cols-2 gap-2 sm:grid-cols-3">{metrics.map((metric) => <div key={metric.label} className="rounded-md border border-border/70 bg-background/45 p-2"><dt className="text-xs text-muted-foreground">{metric.label}</dt><dd className="mt-1 text-sm font-semibold tabular-nums text-foreground">{formatValue(metric.value, metric.format)}</dd></div>)}</dl>;
}

function MemberButton({ row, selected, snuggleProfit, onSelect }: { row: MemberDashboardRow; selected: boolean; snuggleProfit: number | null; onSelect: () => void }) {
  const metrics = memberMetrics(row, snuggleProfit);
  return <button type="button" aria-pressed={selected} onClick={onSelect} className={`grid gap-2 rounded-md border p-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${selected ? "border-primary bg-primary/10" : "border-border bg-card hover:bg-secondary/60"}`}>
    <span className="font-medium text-foreground">{row.teamMemberName}</span>
    <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs sm:grid-cols-3">{metrics.map((metric) => <span key={metric.label} className="flex min-w-0 justify-between gap-2"><span className="truncate text-muted-foreground">{metric.label}</span><span className="shrink-0 tabular-nums text-foreground">{formatValue(metric.value, metric.format)}</span></span>)}</div>
  </button>;
}

function MemberHistory({ row, snuggleData, year }: { row: MemberDashboardRow; snuggleData: SalesDashboardData["snuggle"]; year: number }) {
  const snuggleMonth = getMemberSnuggleProfit(snuggleData, row.teamMemberKey, row.year, row.month);
  return <div className="overflow-x-auto"><table className="w-full min-w-[34rem] text-sm"><thead><tr className="border-b border-border text-left text-xs text-muted-foreground"><th className="px-2 py-2 font-medium">Month</th><th className="px-2 py-2 text-right font-medium">Profit</th><th className="px-2 py-2 text-right font-medium">Snuggle</th><th className="px-2 py-2 text-right font-medium">PK Tax</th><th className="px-2 py-2 text-right font-medium">Quotes</th><th className="px-2 py-2 text-right font-medium">Orders</th></tr></thead><tbody><tr className="border-b border-border/70"><td className="px-2 py-2">{DASHBOARD_MONTHS[row.month - 1] ?? row.month} {year}</td><td className="px-2 py-2 text-right tabular-nums">{money(row.profit)}</td><td className="px-2 py-2 text-right tabular-nums">{money(snuggleMonth)}</td><td className="px-2 py-2 text-right tabular-nums">{money(row.pkTax)}</td><td className="px-2 py-2 text-right tabular-nums">{number(row.quotesDone)}</td><td className="px-2 py-2 text-right tabular-nums">{number(row.ordersProcessed)}</td></tr></tbody></table></div>;
}

export function TeamMembersTab({ data, year, month }: { data: SalesDashboardData; year: number; month: number }) {
  const visibleMembers = useMemo(() => getVisibleTeamMembers(data.members), [data.members]);
  const firstMemberKey = visibleMembers[0]?.teamMemberKey ?? "";
  const [selectedKey, setSelectedKey] = useState(firstMemberKey);

  useEffect(() => {
    setSelectedKey((current) => visibleMembers.some((row) => row.teamMemberKey === current) ? current : firstMemberKey);
  }, [firstMemberKey, visibleMembers]);

  const selected = visibleMembers.find((row) => row.teamMemberKey === selectedKey) ?? null;
  const selectedSnuggleProfit = selected ? getMemberSnuggleProfit(data.snuggle, selected.teamMemberKey, year, month) : null;
  const selectedMetrics = selected ? [...memberMetrics(selected, selectedSnuggleProfit), { label: "Conversion Rate", value: selected.conversionRate, format: "percent" as const }] : [];

  if (!visibleMembers.length) return <EmptyState title="No team member data" />;

  return <div className="grid gap-3 xl:grid-cols-[minmax(0,0.95fr)_minmax(0,1.4fr)]">
    <Panel title="Team Members">
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">{visibleMembers.map((row) => <MemberButton key={row.teamMemberKey} row={row} selected={row.teamMemberKey === selected?.teamMemberKey} snuggleProfit={getMemberSnuggleProfit(data.snuggle, row.teamMemberKey, year, month)} onSelect={() => setSelectedKey(row.teamMemberKey)} />)}</div>
    </Panel>
    <div className="grid content-start gap-3">
      <Panel title={selected?.teamMemberName ?? "Team Member"}>
        {selected ? <><MetricGrid metrics={selectedMetrics} /><div className="mt-3 text-xs text-muted-foreground">{DASHBOARD_MONTHS[month - 1] ?? month} {year}</div></> : <p className="text-sm text-muted-foreground">No data</p>}
      </Panel>
      {selected ? <Panel title="Monthly history"><MemberHistory row={selected} snuggleData={data.snuggle} year={year} /></Panel> : null}
    </div>
  </div>;
}
