"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Panel } from "@/components/ui/Panel";
import { calculateConversionRate, calculatePreviousDifference } from "../domain/calculateDashboardKpis";
import type { MemberDashboardRow } from "../domain/types";

type SortKey = "teamMemberName" | "quotesDone" | "ordersProcessed" | "salesInboxEnquiries" | "converted" | "conversionRate" | "profit";
const columns: Array<[SortKey, string]> = [["teamMemberName", "Team Member"], ["quotesDone", "Quotes"], ["ordersProcessed", "Orders"], ["salesInboxEnquiries", "Enquiries"], ["converted", "Converted"], ["conversionRate", "Rate"], ["profit", "Profit"]];

function number(value: number | null) { return value === null ? "—" : value.toLocaleString("en-GB"); }
function money(value: number | null) { return value === null ? "—" : new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(value); }

export function TeamMemberKpiView({ rows, selectedKey, query }: { rows: MemberDashboardRow[]; selectedKey?: string; query: { year: number; month: number } }) {
  const [sortKey, setSortKey] = useState<SortKey>("teamMemberName");
  const [descending, setDescending] = useState(false);
  const sorted = useMemo(() => [...rows].sort((a, b) => {
    const av = a[sortKey] ?? -1; const bv = b[sortKey] ?? -1;
    const result = typeof av === "string" ? av.localeCompare(String(bv), "en-GB", { sensitivity: "base" }) : Number(av) - Number(bv);
    return descending ? -result : result;
  }), [rows, sortKey, descending]);
  const selected = rows.find((row) => row.teamMemberKey === selectedKey) ?? rows[0] ?? null;
  function changeSort(key: SortKey) { if (key === sortKey) setDescending((value) => !value); else { setSortKey(key); setDescending(false); } }
  return (
    <div className="grid gap-4 xl:grid-cols-[1.4fr_0.6fr]">
      <Panel title="Team Members">
        <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-sm"><thead><tr className="border-b border-border text-left text-xs text-muted-foreground">{columns.map(([key, label]) => <th key={key} className={`px-2 py-2 font-medium ${key !== "teamMemberName" ? "text-right" : ""}`}><button type="button" onClick={() => changeSort(key)} className="hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{label}{sortKey === key ? (descending ? " ↓" : " ↑") : ""}</button></th>)}</tr></thead><tbody>{sorted.map((row) => <tr key={row.teamMemberKey} className="border-b border-border/70"><td className="px-2 py-2 font-medium"><Link className="hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" href={`?year=${query.year}&month=${query.month}&view=members&member=${encodeURIComponent(row.teamMemberKey)}`}>{row.teamMemberName}</Link></td><td className="px-2 py-2 text-right">{number(row.quotesDone)}</td><td className="px-2 py-2 text-right">{number(row.ordersProcessed)}</td><td className="px-2 py-2 text-right">{number(row.salesInboxEnquiries)}</td><td className="px-2 py-2 text-right">{number(row.converted)}</td><td className="px-2 py-2 text-right">{row.conversionRate.toFixed(1)}%</td><td className="px-2 py-2 text-right">{money(row.profit)}</td></tr>)}</tbody></table></div>
      </Panel>
      <Panel title={selected?.teamMemberName ?? "Team Member"}>
        {selected ? <dl className="grid gap-2 text-sm">{[
          ["Quotes Done", selected.quotesDone, selected.previousYear?.quotesDone ?? null, "number"],
          ["Orders Processed", selected.ordersProcessed, selected.previousYear?.ordersProcessed ?? null, "number"],
          ["Sales Inbox Enquiries", selected.salesInboxEnquiries, selected.previousYear?.salesInboxEnquiries ?? null, "number"],
          ["Converted", selected.converted, selected.previousYear?.converted ?? null, "number"],
          ["Conversion Rate", selected.conversionRate, selected.previousYear ? calculateConversionRate(selected.previousYear.converted, selected.previousYear.salesInboxEnquiries) : null, "percent"],
          ["Profit", selected.profit, selected.previousYear?.profit ?? null, "currency"],
        ].map(([label, value, previous, format]) => <div key={String(label)} className="grid grid-cols-[1fr_auto] gap-3 border-b border-border/70 py-2"><dt className="text-muted-foreground">{label}</dt><dd className="text-right tabular-nums"><strong>{format === "currency" ? money(value as number | null) : format === "percent" ? `${Number(value).toFixed(1)}%` : number(value as number | null)}</strong><span className="block text-xs text-muted-foreground">Last year {format === "currency" ? money(previous as number | null) : format === "percent" && previous !== null ? `${Number(previous).toFixed(1)}%` : number(previous as number | null)}{calculatePreviousDifference(value as number | null, previous as number | null) !== null ? ` · ${calculatePreviousDifference(value as number | null, previous as number | null)! >= 0 ? "+" : ""}${calculatePreviousDifference(value as number | null, previous as number | null)}` : ""}</span></dd></div>)}</dl> : <p className="text-sm text-muted-foreground">No data</p>}
      </Panel>
    </div>
  );
}
