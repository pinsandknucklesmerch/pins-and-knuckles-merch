"use client";

import { useMemo, useState } from "react";
import { Copy, RotateCcw } from "lucide-react";
import { ActionButton } from "@/components/ui/ActionButton";
import { Panel } from "@/components/ui/Panel";
import { calculatePkTax, createDefaultPkTaxInput } from "../domain/calculatePkTax.ts";
import { formatPkTaxExport } from "../domain/exportPkTax.ts";
import { PK_TAX_PEOPLE, type PkTaxPerson } from "../domain/types.ts";

const currency = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "GBP",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function display(value: number) {
  return currency.format(value);
}

function parseValue(value: string) {
  if (value.trim() === "") return 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

async function copyText(value: string) {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(value);
    return;
  }
  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "true");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  textarea.remove();
}

export function PkTaxCalculator() {
  const [values, setValues] = useState<Record<PkTaxPerson, string>>(() =>
    Object.fromEntries(PK_TAX_PEOPLE.map((person) => [person, ""])) as Record<PkTaxPerson, string>,
  );
  const result = useMemo(
    () => calculatePkTax(Object.fromEntries(PK_TAX_PEOPLE.map((person) => [person, parseValue(values[person])])) as ReturnType<typeof createDefaultPkTaxInput>),
    [values],
  );

  function updateValue(person: PkTaxPerson, value: string) {
    setValues((current) => ({ ...current, [person]: value.replace(/[^\d.]/g, "") }));
  }

  function reset() {
    setValues(Object.fromEntries(PK_TAX_PEOPLE.map((person) => [person, ""])) as Record<PkTaxPerson, string>);
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(18rem,0.8fr)_minmax(0,1.4fr)]">
      <Panel title="Inputs">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
          {PK_TAX_PEOPLE.map((person) => (
            <label key={person} className="grid gap-1.5 text-sm font-medium text-foreground">
              {person}
              <input
                aria-label={person}
                type="number"
                min="0"
                step="0.01"
                inputMode="decimal"
                value={values[person]}
                onChange={(event) => updateValue(person, event.target.value)}
                className="h-9 rounded-md border border-input bg-background px-3 text-right tabular-nums text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring"
              />
            </label>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <ActionButton onClick={() => void copyText(formatPkTaxExport(result))}>
            <Copy className="mr-2 size-4" aria-hidden="true" />
            Export summary
          </ActionButton>
          <button type="button" onClick={reset} className="inline-flex h-9 items-center justify-center rounded-md border border-border px-3 text-sm font-medium text-foreground transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <RotateCcw className="mr-2 size-4" aria-hidden="true" />
            Reset
          </button>
        </div>
      </Panel>

      <Panel title="Calculated results">
        <div className="grid gap-4">
          <div className="grid gap-2 sm:grid-cols-3">
            {[
              ["Total input", result.totalInput],
              ["Total allocated", result.totalAllocated],
              ["Pool balance / difference", result.poolBalance],
            ].map(([label, value]) => (
              <div key={label} className="rounded-md border border-border/70 bg-background/55 p-3 backdrop-blur-sm">
                <div className="text-xs text-muted-foreground">{label}</div>
                <div className="mt-1 text-lg font-semibold tabular-nums text-foreground">{display(value as number)}</div>
              </div>
            ))}
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            <Breakdown title="Direct allocations" rows={[
              ["EPCC · 40%", result.epccAllocation],
              ["Johan · 40%", result.johanAllocation],
              ["Admin · 10%", result.adminAllocation],
              ["Marketing · 5%", result.marketingAllocation],
              ["Operations · 5%", result.operationsAllocation],
            ]} />
            <Breakdown title="Pool contributions" rows={[
              ...result.contributions.map((contribution) => [`${contribution.person} · ${(contribution.rate * 100).toFixed(0)}%`, contribution.amount] as [string, number]),
              ["Pool total", result.poolTotal],
            ]} />
          </div>

          <Breakdown title="Pool recipients" rows={result.recipientAllocations.map((allocation) => [allocation.person, allocation.amount])} />
        </div>
      </Panel>
    </div>
  );
}

function Breakdown({ title, rows }: { title: string; rows: [string, number][] }) {
  return (
    <div className="rounded-md border border-border/70 bg-background/55 p-3 backdrop-blur-sm">
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <dl className="mt-2 divide-y divide-border text-sm">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-center justify-between gap-3 py-2 first:pt-0 last:pb-0">
            <dt className="text-muted-foreground">{label}</dt>
            <dd className="tabular-nums text-foreground">{display(value)}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
