"use client";

import { useMemo, useState } from "react";
import { RotateCcw } from "lucide-react";
import { ActionMenu } from "@/components/ui/ActionMenu";
import { Surface } from "@/components/ui/Surface";
import { InvoiceForm } from "./InvoiceForm";
import { InvoicePreview } from "./InvoicePreview";
import {
  addLineItem,
  calculateInvoice,
  createLineItem,
  removeLineItem,
  validateInvoice,
} from "../domain/calculateInvoice";
import { applyOriginRule } from "../domain/countryOfOrigin";
import { exportInvoicePdf, exportInvoiceXlsx } from "../domain/exportInvoice";
import type { CommercialInvoice, InvoiceAddress, InvoiceLineItem } from "../domain/types";

const EMPTY_ADDRESS: InvoiceAddress = { companyName: "", contactName: "", address: "", country: "", eori: "", vat: "", ein: "", telephone: "", email: "", notes: "" };

function createId() {
  return typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
}

function createDefaultInvoice(): CommercialInvoice {
  const today = new Date().toISOString().slice(0, 10);
  return {
    details: { reference: "", date: today, shipDate: today, tracking: "", boxCount: "", weight: "", currency: "GBP", printLocation: "", dutiesPayableBy: "" },
    sender: { ...EMPTY_ADDRESS },
    receiver: { ...EMPTY_ADDRESS },
    lineItems: [createLineItem(createId())],
  };
}

export function CommercialInvoiceGenerator() {
  const [invoice, setInvoice] = useState(createDefaultInvoice);
  const [errors, setErrors] = useState<ReturnType<typeof validateInvoice>>({});
  const [exporting, setExporting] = useState<"pdf" | "xlsx" | null>(null);
  const calculated = useMemo(() => calculateInvoice(invoice), [invoice]);

  function reset() {
    setInvoice(createDefaultInvoice());
    setErrors({});
  }

  function prepareExport() {
    const nextErrors = validateInvoice(invoice);
    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  }

  async function runExport(format: "pdf" | "xlsx") {
    if (!prepareExport()) return;
    setExporting(format);
    try {
      if (format === "pdf") await exportInvoicePdf(calculated);
      else await exportInvoiceXlsx(calculated);
    } finally {
      setExporting(null);
    }
  }

  function updateLine(id: string, field: keyof InvoiceLineItem, value: string) {
    setInvoice((current) => ({
      ...current,
      lineItems: current.lineItems.map((item) => {
        if (item.id !== id) return item;
        const next = { ...item, [field]: value };
        return field === "product" || field === "type" || field === "description" ? applyOriginRule(next) : next;
      }),
    }));
  }

  return (
    <div className="grid min-w-0 gap-4">
      <div className="no-print flex flex-wrap gap-2">
        <ActionMenu label="Export" pending={Boolean(exporting)} items={[{ label: "Export Excel", onSelect: () => void runExport("xlsx") }, { label: "Export PDF", onSelect: () => void runExport("pdf") }]} />
        <button type="button" onClick={reset} className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-border bg-background px-3 text-sm font-medium text-foreground transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><RotateCcw className="size-4" />Reset</button>
      </div>

      <InvoiceForm
        invoice={invoice}
        errors={errors}
        onDetailsChange={(field, value) => setInvoice((current) => ({ ...current, details: { ...current.details, [field]: value } }))}
        onAddressChange={(target, field, value) => setInvoice((current) => ({ ...current, [target]: { ...current[target], [field]: value } }))}
        onLineChange={updateLine}
        onAddLine={() => setInvoice((current) => ({ ...current, lineItems: addLineItem(current.lineItems, createId()) }))}
        onRemoveLine={(id) => setInvoice((current) => ({ ...current, lineItems: removeLineItem(current.lineItems, id) }))}
      />

      <section className="grid gap-3">
        <h2 className="text-sm font-semibold">Preview</h2>
        <Surface className="overflow-x-auto bg-muted p-[var(--hub-compact-card-padding)] sm:p-[var(--hub-card-padding)]"><InvoicePreview invoice={calculated} /></Surface>
      </section>
    </div>
  );
}
