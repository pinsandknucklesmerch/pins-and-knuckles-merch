"use client";

import { useActionState, useState } from "react";
import { saveManualKpis, type ManualKpiActionState } from "../actions";
import type { CompanyKpiMonth } from "../domain/types";
import { DASHBOARD_MONTHS } from "../types";

const initialState: ManualKpiActionState = { ok: false, message: "" };
const inputClass = "h-9 rounded-md border border-input bg-background px-2.5 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring";

function NumericField({ name, label, value, step = "1" }: { name: string; label: string; value?: number | null; step?: string }) {
  return <label className="grid gap-1 text-xs font-medium text-muted-foreground">{label}<input className={inputClass} name={name} type="number" min="0" step={step} defaultValue={value ?? ""} /></label>;
}

export function ManualKpiEntry({ year, month, company }: { year: number; month: number; company: CompanyKpiMonth }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState(saveManualKpis, initialState);
  return (
    <section className="grid gap-3">
      <button type="button" onClick={() => setOpen((value) => !value)} className="h-9 justify-self-start rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">{open ? "Close Entry" : "Edit KPIs"}</button>
      {open ? (
        <form action={action} className="grid gap-4 rounded-lg border border-border bg-card p-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <label className="grid gap-1 text-xs font-medium text-muted-foreground">Year<input className={inputClass} name="year" type="number" min="2020" defaultValue={year} required /></label>
            <label className="grid gap-1 text-xs font-medium text-muted-foreground">Month<select className={inputClass} name="month" defaultValue={month}>{DASHBOARD_MONTHS.map((name, index) => <option key={name} value={index + 1}>{name}</option>)}</select></label>
          </div>
          <fieldset className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <legend className="mb-2 text-sm font-semibold text-foreground">Company</legend>
            <NumericField name="monthly_profit" label="Monthly Profit" value={company.monthlyProfit} step="0.01" />
            <NumericField name="quotes_done" label="Quotes Done" value={company.quotesDone} />
            <NumericField name="orders_processed" label="Orders Processed" value={company.ordersProcessed} />
            <NumericField name="sales_inbox_enquiries" label="Sales Inbox Enquiries" value={company.salesInboxEnquiries} />
            <NumericField name="converted" label="Converted" value={company.converted} />
            <label className="grid gap-1 text-xs font-medium text-muted-foreground sm:col-span-2 lg:col-span-3">Notes<textarea className="min-h-20 rounded-md border border-input bg-background px-2.5 py-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring" name="notes" defaultValue={company.notes ?? ""} /></label>
          </fieldset>
          <fieldset className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <legend className="mb-2 text-sm font-semibold text-foreground">Team Member</legend>
            <label className="grid gap-1 text-xs font-medium text-muted-foreground">Team Member<input className={inputClass} name="team_member_name" /></label>
            <NumericField name="member_quotes_done" label="Quotes Done" />
            <NumericField name="member_orders_processed" label="Orders Processed" />
            <NumericField name="member_sales_inbox_enquiries" label="Sales Inbox Enquiries" />
            <NumericField name="member_converted" label="Converted" />
            <NumericField name="member_profit" label="Profit" step="0.01" />
          </fieldset>
          {state.message ? <p role="status" className={`text-sm ${state.ok ? "text-emerald-400" : "text-destructive"}`}>{state.message}</p> : null}
          <button disabled={pending} className="h-9 justify-self-start rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground disabled:opacity-50" type="submit">{pending ? "Saving…" : "Save"}</button>
        </form>
      ) : null}
    </section>
  );
}
