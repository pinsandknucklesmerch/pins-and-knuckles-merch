"use client";

import { useActionState, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { clearSalesKpiMonthFinalValue, saveSalesKpiMonthFinalValue, type FinalValueActionState } from "../actions";
import type { FinalisableSalesKpiCode, MetricResult } from "../domain/types";
import { feedback } from "@/components/ui/feedback";

const initial: FinalValueActionState = { ok: false, message: "" };
const codes = new Set<FinalisableSalesKpiCode>(["MONTHLY_PROFIT", "PK_TAX", "QUOTES_DONE", "ORDERS_PROCESSED"]);
const format = (metric: MetricResult, value: number | null | undefined) => value === null || value === undefined ? "—" : metric.format === "currency" ? new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", minimumFractionDigits: 2 }).format(value) : value.toLocaleString("en-GB");

export function MonthlyKpiFinals({ metrics, year, month, isAdmin }: { metrics: MetricResult[]; year: number; month: number; isAdmin: boolean }) {
  const [editing, setEditing] = useState<MetricResult | null>(null);
  const finalMetrics = metrics.filter((metric) => codes.has(metric.code as FinalisableSalesKpiCode));
  return <section className="grid gap-2" aria-label="Month-end final values">
    {finalMetrics.map((metric) => <div key={metric.code} className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 py-2 text-sm last:border-0">
      <div className="min-w-0"><span className="font-medium">{metric.label}</span><span className="ml-2 text-muted-foreground">Calculated {format(metric, metric.calculatedValue)}</span>{metric.isFinal ? <span className="ml-2 text-primary">Final {format(metric, metric.finalValue)}</span> : null}</div>
      {isAdmin ? <button type="button" onClick={() => setEditing(metric)} className="h-8 rounded-md border border-input px-2 text-xs font-medium hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{metric.isFinal ? "Edit Final" : "Set Final"}</button> : null}
    </div>)}
    {editing ? <FinalValueDialog metric={editing} year={year} month={month} onClose={() => setEditing(null)} /> : null}
  </section>;
}

function FinalValueDialog({ metric, year, month, onClose }: { metric: MetricResult; year: number; month: number; onClose: () => void }) {
  const action = saveSalesKpiMonthFinalValue.bind(null, { year, month });
  const [state, formAction, pending] = useActionState(action, initial);
  useEffect(() => { if (state.ok) { feedback.success(state.message); onClose(); } }, [state, onClose]);
  const clear = async () => { if (!metric.isFinal || !confirm(`Clear final ${metric.label}?`)) return; const result = await clearSalesKpiMonthFinalValue({ year, month, metricCode: metric.code as FinalisableSalesKpiCode }); if (result.ok) { feedback.success(result.message); onClose(); } else feedback.error(result.message); };
  const isCount = metric.format === "number";
  const defaultValue = metric.finalValue ?? metric.calculatedValue;
  return createPortal(<div className="fixed inset-0 z-50 grid place-items-center bg-black/65 p-4" role="dialog" aria-modal="true" aria-labelledby="final-value-title"><form action={formAction} className="grid w-full max-w-sm gap-4 rounded-lg border border-border bg-card p-4 shadow-lg"><div className="flex items-center justify-between gap-3"><h2 id="final-value-title" className="text-base font-semibold">Final {metric.label}</h2><button type="button" onClick={onClose} className="h-8 rounded-md border border-input px-2 text-sm hover:bg-accent">Close</button></div><input type="hidden" name="metricCode" value={metric.code} /><label className="grid gap-1 text-xs font-medium text-muted-foreground">Value<input autoFocus required {...(isCount ? { min: "0", step: "1", type: "number" } : { inputMode: "decimal" as const, type: "text" })} defaultValue={defaultValue === null || defaultValue === undefined ? "" : isCount ? defaultValue : format(metric, defaultValue)} name="value" className="h-9 rounded-md border border-input bg-background px-2.5 text-sm text-foreground" /></label>{state.message && !state.ok ? <p role="alert" className="text-sm text-destructive">{state.message}</p> : null}<div className="flex flex-wrap gap-2"><button disabled={pending} type="submit" className="h-9 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground disabled:opacity-50">{pending ? "Saving…" : "Save Final"}</button>{metric.isFinal ? <button type="button" onClick={() => void clear()} className="h-9 rounded-md border border-destructive/60 px-3 text-sm font-medium text-destructive hover:bg-destructive/10">Clear Final</button> : null}</div></form></div>, document.body);
}
