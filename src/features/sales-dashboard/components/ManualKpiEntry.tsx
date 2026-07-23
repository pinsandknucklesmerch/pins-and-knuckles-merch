"use client";

import { useActionState, useState } from "react";
import { createPortal } from "react-dom";
import { saveSalesKpiTargets, type TargetActionState } from "../actions";
import type { SalesKpiTargets, SalesMetricCode } from "../domain/types";

const initialState: TargetActionState = { ok: false, message: "" };
const inputClass = "h-9 rounded-md border border-input bg-background px-2.5 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring";

const fields: Array<{ code: SalesMetricCode; label: string; step: string; suffix: string }> = [
  { code: "MONTHLY_PROFIT", label: "Monthly Profit", step: "0.01", suffix: "GBP" },
  { code: "QUOTES_DONE", label: "Quotes Done", step: "1", suffix: "" },
  { code: "ORDERS_PROCESSED", label: "Orders Processed", step: "1", suffix: "" },
  { code: "CONVERSION_RATE", label: "Conversion Rate", step: "0.1", suffix: "%" },
];

export function ManualKpiEntry({ year, month, targets }: { year: number; month: number; targets: SalesKpiTargets }) {
  const [open, setOpen] = useState(false);
  const action = saveSalesKpiTargets.bind(null, { year, month });
  const [state, formAction, pending] = useActionState(action, initialState);
  const configuredFields = fields.filter((field) => targets[field.code] !== undefined);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="h-9 rounded-md border border-input bg-card px-3 text-sm font-medium text-foreground hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Edit Targets</button>
      {open ? createPortal(
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/65 p-4" role="dialog" aria-modal="true" aria-labelledby="edit-targets-title">
          <form action={formAction} className="grid w-full max-w-2xl gap-4 rounded-lg border border-border bg-card p-4 shadow-lg">
            <div className="flex items-center justify-between gap-3">
              <h2 id="edit-targets-title" className="text-base font-semibold text-foreground">Edit Targets</h2>
              <button type="button" onClick={() => setOpen(false)} className="h-8 rounded-md border border-input px-2 text-sm text-foreground hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Close</button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {configuredFields.map((field) => (
                <label key={field.code} className="grid gap-1 text-xs font-medium text-muted-foreground">
                  {field.label}
                  <span className="flex items-center gap-2">
                    <input className={inputClass} name={field.code} type="number" min="0" max={field.code === "CONVERSION_RATE" ? "100" : undefined} step={field.step} defaultValue={targets[field.code]} required />
                    {field.suffix ? <span className="text-xs text-muted-foreground">{field.suffix}</span> : null}
                  </span>
                </label>
              ))}
            </div>
            {state.message ? <p role={state.ok ? "status" : "alert"} className={`text-sm ${state.ok ? "text-emerald-400" : "text-destructive"}`}>{state.message}</p> : null}
            <button disabled={pending} className="h-9 justify-self-start rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground disabled:opacity-50" type="submit">{pending ? "Saving…" : "Save Targets"}</button>
          </form>
        </div>
      , document.body) : null}
    </>
  );
}
