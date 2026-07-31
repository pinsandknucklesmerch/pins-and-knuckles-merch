"use client";

import { useMemo, useState } from "react";
import { Copy, RotateCcw } from "lucide-react";
import { ActionMenu } from "@/components/ui/ActionMenu";
import { FormField } from "@/components/ui/FormField";
import { NumberInput } from "@/components/ui/Input";
import { Panel } from "@/components/ui/Panel";
import { Surface } from "@/components/ui/Surface";
import { copyText } from "@/components/ui/copyText";
import { calculatePkTax, createDefaultPkTaxInput } from "../domain/calculatePkTax.ts";
import { formatPkTaxExport } from "../domain/exportPkTax.ts";
import { PK_TAX_POOL_CONTRIBUTORS, PK_TAX_RECIPIENTS, type PkTaxInput } from "../domain/types.ts";

const currency = new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", minimumFractionDigits: 2, maximumFractionDigits: 2 });
const percent = new Intl.NumberFormat("en-GB", { style: "percent", minimumFractionDigits: 2, maximumFractionDigits: 2 });

function display(value: number) { return currency.format(value); }
function parseValue(value: string) { const parsed = Number(value); return value.trim() === "" || !Number.isFinite(parsed) || parsed < 0 ? 0 : parsed; }
function blankValues() {
  const defaults = createDefaultPkTaxInput();
  return JSON.parse(JSON.stringify(defaults)) as Record<string, unknown>;
}

type NumericFieldProps = { label: string; value: string; onChange: (value: string) => void; error?: string | null };
function NumericField({ label, value, onChange, error }: NumericFieldProps) {
  return <FormField label={label} error={error ?? undefined}><NumberInput type="number" min="0" step="0.01" inputMode="decimal" value={value} onChange={(event) => onChange(event.target.value.replace(/[^\d.]/g, ""))} className="text-right tabular-nums" /></FormField>;
}

function valuesToInput(values: Record<string, unknown>): PkTaxInput {
  return {
    overallTotal: parseValue(String(values.overallTotal ?? "")),
    totalSnuggleProfit: parseValue(String(values.totalSnuggleProfit ?? "")),
    johanPkTax: parseValue(String(values.johanPkTax ?? "")),
    pkTaxBroughtIn: Object.fromEntries(PK_TAX_POOL_CONTRIBUTORS.map((person) => [person, parseValue(String((values.pkTaxBroughtIn as Record<string, string>)[person] ?? ""))])) as PkTaxInput["pkTaxBroughtIn"],
    performance: Object.fromEntries(PK_TAX_RECIPIENTS.map((person) => [person, {
      companyProfit: parseValue(String((values.performance as Record<string, Record<string, string>>)[person]?.companyProfit ?? "")),
      snuggleProfit: parseValue(String((values.performance as Record<string, Record<string, string>>)[person]?.snuggleProfit ?? "")),
      ordersHandled: parseValue(String((values.performance as Record<string, Record<string, string>>)[person]?.ordersHandled ?? "")),
    }])) as PkTaxInput["performance"],
  };
}

export function PkTaxCalculator() {
  const [values, setValues] = useState<Record<string, unknown>>(blankValues);
  const result = useMemo(() => calculatePkTax(valuesToInput(values)), [values]);
  const setValue = (path: string[], value: string) => setValues((current) => {
    const next = structuredClone(current) as Record<string, unknown>;
    let target = next;
    path.slice(0, -1).forEach((part) => { target[part] = target[part] ?? {}; target = target[part] as Record<string, unknown>; });
    target[path.at(-1) ?? ""] = value;
    return next;
  });
  async function copyResults() {
    await copyText(formatPkTaxExport(result));
  }

  return (
    <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(20rem,0.9fr)_minmax(0,1.4fr)]">
      <div className="grid content-start gap-4">
        <Panel title="Overall"><div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
          <NumericField label="Overall total" value={String(values.overallTotal ?? "")} onChange={(value) => setValue(["overallTotal"], value)} />
          <NumericField label="Total Snuggle profit" value={String(values.totalSnuggleProfit ?? "")} onChange={(value) => setValue(["totalSnuggleProfit"], value)} />
          <NumericField label="Johan PK Tax" value={String(values.johanPkTax ?? "")} onChange={(value) => setValue(["johanPkTax"], value)} />
        </div></Panel>
        <Panel title="PK Tax brought in"><div className="grid gap-3 sm:grid-cols-2">
          {PK_TAX_POOL_CONTRIBUTORS.map((person) => <NumericField key={person} label={person} value={String((values.pkTaxBroughtIn as Record<string, string>)[person] ?? "")} onChange={(value) => setValue(["pkTaxBroughtIn", person], value)} />)}
        </div></Panel>
        <Panel title="Performance"><div className="grid gap-4">
          {PK_TAX_RECIPIENTS.map((person, index) => <Surface key={person} variant="compact" className="grid gap-3 bg-background/55"><h2 className="text-sm font-semibold text-foreground">{person}</h2><div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
            <NumericField label="Company profit" value={String((values.performance as Record<string, Record<string, string>>)[person]?.companyProfit ?? "")} onChange={(value) => setValue(["performance", person, "companyProfit"], value)} error={index === 0 ? result.validationError : null} />
            <NumericField label="Snuggle profit" value={String((values.performance as Record<string, Record<string, string>>)[person]?.snuggleProfit ?? "")} onChange={(value) => setValue(["performance", person, "snuggleProfit"], value)} />
            <NumericField label="Orders handled" value={String((values.performance as Record<string, Record<string, string>>)[person]?.ordersHandled ?? "")} onChange={(value) => setValue(["performance", person, "ordersHandled"], value)} />
          </div></Surface>)}
        </div></Panel>
        <button type="button" onClick={() => setValues(blankValues())} className="inline-flex h-9 w-fit items-center justify-center gap-2 rounded-md border border-border px-3 text-sm font-medium text-foreground transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><RotateCcw className="size-4" aria-hidden="true" />Reset</button>
      </div>

      <Panel><div className="mb-3 flex items-center justify-between gap-3"><h2 className="text-sm font-semibold text-foreground">Results</h2><ActionMenu label="Export" icon={<Copy className="size-4" aria-hidden="true" />} items={[{ label: "Copy results", onSelect: () => void copyResults() }]} /></div>
        <div className="grid gap-3">
          <Breakdown title="Fixed allocations" rows={[["EPCC", result.epccAllocation], ["Admin", result.adminAllocation], ["Marketing", result.marketingAllocation], ["Ops", result.operationsAllocation], ["Johan", result.johanAllocation]]} />
          <Breakdown title="PK pool" rows={[["Sales-team PK Tax contribution", result.salesTeamContribution], ["Snuggle contribution", result.snuggleContribution], ["Total PK pool", result.poolTotal]]} />
          <section className="grid gap-2"><h3 className="text-sm font-semibold text-foreground">Weighted allocations</h3>{result.recipientAllocations.map((allocation) => <Surface key={allocation.person} variant="compact" className="bg-background/55"><h4 className="text-sm font-semibold text-foreground">{allocation.person}</h4><dl className="mt-2 divide-y divide-border text-sm">
            <MetricRow label="Company profit share" value={percent.format(allocation.metricShares.companyProfit)} />
            <MetricRow label="Snuggle profit share" value={percent.format(allocation.metricShares.snuggleProfit)} />
            <MetricRow label="PK Tax share" value={percent.format(allocation.metricShares.pkTax)} />
            <MetricRow label="Orders share" value={percent.format(allocation.metricShares.ordersHandled)} />
            <MetricRow label="Final weighted score" value={percent.format(allocation.weightedScore)} />
            <MetricRow label="Pool allocation" value={allocation.amount === null ? "—" : display(allocation.amount)} />
          </dl></Surface>)}</section>
        </div></Panel>
    </div>
  );
}

function Breakdown({ title, rows }: { title: string; rows: [string, number][] }) {
  return <Surface variant="compact" className="bg-background/55"><h3 className="text-sm font-semibold text-foreground">{title}</h3><dl className="mt-2 divide-y divide-border text-sm">{rows.map(([label, value]) => <MetricRow key={label} label={label} value={display(value)} />)}</dl></Surface>;
}
function MetricRow({ label, value }: { label: string; value: string }) {
  return <div className="flex items-center justify-between gap-3 py-2 first:pt-0 last:pb-0"><dt className="text-muted-foreground">{label}</dt><dd className="shrink-0 tabular-nums text-foreground">{value}</dd></div>;
}
