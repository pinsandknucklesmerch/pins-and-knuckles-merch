"use client";

import { Plus, Trash2 } from "lucide-react";
import { Panel } from "@/components/ui/Panel";
import {
  calculateLineTotal,
  type validateInvoice,
} from "../domain/calculateInvoice";
import { formatMoney } from "../domain/formatInvoice";
import { getOriginRule } from "../domain/countryOfOrigin";
import type {
  CommercialInvoice,
  InvoiceAddress,
  InvoiceLineItem,
  InvoiceValidationErrors,
} from "../domain/types";

type Props = {
  invoice: CommercialInvoice;
  errors: ReturnType<typeof validateInvoice>;
  onDetailsChange: (field: keyof CommercialInvoice["details"], value: string) => void;
  onAddressChange: (target: "sender" | "receiver", field: keyof InvoiceAddress, value: string) => void;
  onLineChange: (id: string, field: keyof InvoiceLineItem, value: string) => void;
  onAddLine: () => void;
  onRemoveLine: (id: string) => void;
};

const inputClass =
  "h-9 w-full rounded-md border border-input bg-background px-2.5 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring";
const areaClass = `${inputClass} h-auto min-h-20 resize-y py-2`;

function Field({
  label,
  error,
  children,
  className = "",
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`grid min-w-0 gap-1 text-xs font-medium ${className}`}>
      <span className="flex justify-between gap-2">
        {label}
        {error ? <span className="text-destructive">{error}</span> : null}
      </span>
      {children}
    </label>
  );
}

function AddressFields({
  title,
  prefix,
  value,
  errors,
  onChange,
}: {
  title: string;
  prefix: "sender" | "receiver";
  value: InvoiceAddress;
  errors: InvoiceValidationErrors;
  onChange: (field: keyof InvoiceAddress, value: string) => void;
}) {
  const fields: [keyof InvoiceAddress, string][] = [
    ["companyName", "Company Name"],
    ["contactName", "Contact Name"],
    ["country", "Country"],
    ["telephone", "Telephone"],
    ["eori", "EORI"],
    ["vat", "VAT"],
    ["ein", "EIN"],
    ["email", "Email"],
  ];
  return (
    <Panel title={title} className="min-w-0">
      <div className="grid gap-3 sm:grid-cols-2">
        {fields.slice(0, 4).map(([field, label]) => (
          <Field key={field} label={label} error={errors[`${prefix}.${field}`]}>
            <input className={inputClass} value={value[field]} onChange={(event) => onChange(field, event.target.value)} />
          </Field>
        ))}
        <Field label="Address" error={errors[`${prefix}.address`]} className="sm:col-span-2">
          <textarea className={areaClass} rows={3} value={value.address} onChange={(event) => onChange("address", event.target.value)} />
        </Field>
        {fields.slice(4).map(([field, label]) => (
          <Field key={field} label={label} error={errors[`${prefix}.${field}`]}>
            <input className={inputClass} value={value[field]} onChange={(event) => onChange(field, event.target.value)} />
          </Field>
        ))}
        <Field label="Notes" className="sm:col-span-2">
          <textarea className={areaClass} rows={2} value={value.notes} onChange={(event) => onChange("notes", event.target.value)} />
        </Field>
      </div>
    </Panel>
  );
}

export function InvoiceForm({
  invoice,
  errors,
  onDetailsChange,
  onAddressChange,
  onLineChange,
  onAddLine,
  onRemoveLine,
}: Props) {
  const details = invoice.details;
  return (
    <div className="grid min-w-0 gap-4">
      <Panel title="Invoice Details">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <Field label="Invoice No / Reference" error={errors.reference}>
            <input className={inputClass} value={details.reference} onChange={(e) => onDetailsChange("reference", e.target.value)} />
          </Field>
          <Field label="Date"><input type="date" className={inputClass} value={details.date} onChange={(e) => onDetailsChange("date", e.target.value)} /></Field>
          <Field label="Ship Date"><input type="date" className={inputClass} value={details.shipDate} onChange={(e) => onDetailsChange("shipDate", e.target.value)} /></Field>
          <Field label="Tracking"><input className={inputClass} value={details.tracking} onChange={(e) => onDetailsChange("tracking", e.target.value)} /></Field>
          <Field label="Box Count"><input type="number" min="0" className={inputClass} value={details.boxCount} onChange={(e) => onDetailsChange("boxCount", e.target.value)} /></Field>
          <Field label="Weight"><input className={inputClass} placeholder="18 kg" value={details.weight} onChange={(e) => onDetailsChange("weight", e.target.value)} /></Field>
          <Field label="Currency">
            <select className={inputClass} value={details.currency} onChange={(e) => onDetailsChange("currency", e.target.value)}><option>GBP</option><option>EUR</option></select>
          </Field>
          <Field label="Print Location" error={errors.printLocation}>
            <select className={inputClass} value={details.printLocation} onChange={(e) => onDetailsChange("printLocation", e.target.value)}><option value="">Select</option><option>United Kingdom</option><option>Hungary</option></select>
          </Field>
          <Field label="Duties Payable By" error={errors.dutiesPayableBy}>
            <select className={inputClass} value={details.dutiesPayableBy} onChange={(e) => onDetailsChange("dutiesPayableBy", e.target.value)}><option value="">Select</option><option>Sender</option><option>Receiver</option></select>
          </Field>
        </div>
      </Panel>

      <div className="grid min-w-0 gap-4 2xl:grid-cols-2">
        <AddressFields title="Sender" prefix="sender" value={invoice.sender} errors={errors} onChange={(field, value) => onAddressChange("sender", field, value)} />
        <AddressFields title="Receiver" prefix="receiver" value={invoice.receiver} errors={errors} onChange={(field, value) => onAddressChange("receiver", field, value)} />
      </div>

      <Panel className="min-w-0">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold">Line Items</h2>
          <button type="button" onClick={onAddLine} className="inline-flex h-8 items-center gap-1.5 rounded-md bg-primary px-2.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <Plus className="size-3.5" /> Add Line
          </button>
        </div>
        {errors.lineItems ? <p className="mb-2 text-xs text-destructive">{errors.lineItems}</p> : null}
        <div className="grid gap-3">
          {invoice.lineItems.map((item, index) => {
            const originRule = getOriginRule(item);
            return (
              <fieldset key={item.id} className="min-w-0 rounded-md bg-secondary/45 p-3">
                <legend className="sr-only">Line {index + 1}</legend>
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-xs font-semibold text-muted-foreground">Line {index + 1}</span>
                  <button type="button" aria-label={`Remove line ${index + 1}`} disabled={invoice.lineItems.length === 1} onClick={() => onRemoveLine(item.id)} className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive disabled:opacity-30">
                    <Trash2 className="size-4" />
                  </button>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <Field label="Product" error={errors[`${item.id}.product`]}><input className={inputClass} value={item.product} onChange={(e) => onLineChange(item.id, "product", e.target.value)} /></Field>
                  <Field label="Design Name"><input className={inputClass} value={item.designName} onChange={(e) => onLineChange(item.id, "designName", e.target.value)} /></Field>
                  <Field label="Type / Material"><input className={inputClass} value={item.type} onChange={(e) => onLineChange(item.id, "type", e.target.value)} /></Field>
                  <Field label="Description"><input className={inputClass} value={item.description} onChange={(e) => onLineChange(item.id, "description", e.target.value)} /></Field>
                  <Field label="Cost" error={errors[`${item.id}.cost`]}><input type="number" min="0" step="0.01" className={inputClass} value={item.cost} onChange={(e) => onLineChange(item.id, "cost", e.target.value)} /></Field>
                  <Field label="Qty" error={errors[`${item.id}.quantity`]}><input type="number" min="0" step="1" className={inputClass} value={item.quantity} onChange={(e) => onLineChange(item.id, "quantity", e.target.value)} /></Field>
                  <Field label="Line Total"><output className={`${inputClass} flex items-center bg-muted/40`}>{formatMoney(calculateLineTotal(item), details.currency)}</output></Field>
                  <Field label="Commodity Code"><input className={inputClass} value={item.commodityCode} onChange={(e) => onLineChange(item.id, "commodityCode", e.target.value)} /></Field>
                  <Field label="Country of Origin" className="sm:col-span-2 xl:col-span-1">
                    {originRule.mode === "variable" ? (
                      <><select className={inputClass} value={originRule.countries.includes(item.countryOfOrigin) ? item.countryOfOrigin : "__manual"} onChange={(e) => onLineChange(item.id, "countryOfOrigin", e.target.value === "__manual" ? "" : e.target.value)}><option value="">Select</option>{originRule.countries.map((country) => <option key={country}>{country}</option>)}<option value="__manual">Other / manual</option></select>{!originRule.countries.includes(item.countryOfOrigin) ? <input aria-label="Manual country of origin" className={`${inputClass} mt-2`} value={item.countryOfOrigin} onChange={(e) => onLineChange(item.id, "countryOfOrigin", e.target.value)} /> : null}</>
                    ) : <input className={inputClass} value={item.countryOfOrigin} onChange={(e) => onLineChange(item.id, "countryOfOrigin", e.target.value)} />}
                  </Field>
                </div>
              </fieldset>
            );
          })}
        </div>
      </Panel>
    </div>
  );
}
