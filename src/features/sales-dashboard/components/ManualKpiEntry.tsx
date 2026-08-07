"use client";

import { useActionState, useEffect, useState } from "react";
import { saveSalesKpiTargets } from "../actions";
import type { TargetActionState } from "../lib/targetSave";
import type { SalesKpiTargets, SalesMetricCode } from "../domain/types";
import { feedback, isInlineValidation } from "@/components/ui/feedback";
import { Dialog } from "@/components/ui/Dialog";

const initialState: TargetActionState = { ok: false, message: "" };
const inputClass = "hub-native-control";

const fields: Array<{ code: SalesMetricCode; label: string; step: string; suffix: string }> = [
  { code: "MONTHLY_PROFIT", label: "Monthly Profit", step: "0.01", suffix: "GBP" },
  { code: "QUOTES_DONE", label: "Quotes Done", step: "1", suffix: "" },
  { code: "ORDERS_PROCESSED", label: "Orders Processed", step: "1", suffix: "" },
  { code: "CONVERSION_RATE", label: "Conversion Rate", step: "0.1", suffix: "%" },
];

export function ManualKpiEntry({ year, month, targets }: { year: number; month: number; targets: SalesKpiTargets }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="h-9 rounded-md border border-input bg-card px-3 text-sm font-medium text-foreground hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Edit Targets</button>
      {open ? <ManualKpiForm year={year} month={month} targets={targets} onClose={() => setOpen(false)} /> : null}
    </>
  );
}

function ManualKpiForm({ year, month, targets, onClose }: { year: number; month: number; targets: SalesKpiTargets; onClose: () => void }) {
  const action = saveSalesKpiTargets.bind(null, { year, month });
  const [state, formAction, pending] = useActionState(action, initialState);
  const configuredFields = fields.filter((field) => targets[field.code] !== undefined);
  const effectiveMonth = new Intl.DateTimeFormat("en-GB", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(Date.UTC(year, month - 1, 1)));
  useEffect(() => { if (!state.message) return; if (state.ok) feedback.success("Targets updated"); else if (!isInlineValidation(state.message)) feedback.error(state.message); }, [state]);

  return <Dialog open onClose={onClose} title="Edit Targets" description={`Changes apply from ${effectiveMonth} onward.`} className="max-w-2xl">
          <form action={formAction} className="grid max-h-[calc(100dvh-10rem)] gap-4 overflow-y-auto">
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
            {state.message && !state.ok && isInlineValidation(state.message) ? <p role="alert" className="text-sm text-destructive">{state.message}</p> : null}
            <button disabled={pending} className="h-9 justify-self-start rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground disabled:opacity-50" type="submit">{pending ? "Saving…" : "Save Targets"}</button>
          </form>
        </Dialog>;
}
