"use client";

import { useMemo, useState } from "react";
import { RotateCcw } from "lucide-react";
import { ActionMenu } from "@/components/ui/ActionMenu";
import { Surface } from "@/components/ui/Surface";
import { feedback } from "@/components/ui/feedback";
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
import {
  manuallyEditInvoiceCompanyName,
  manuallyEditInvoiceName,
  selectInvoiceCompany,
  selectProductType,
} from "../domain/invoiceDirectorySelection";
import { exportInvoicePdf, exportInvoiceXlsx } from "../domain/exportInvoice";
import type { InvoiceCompany, ProductTypeInvoiceOption } from "../domain/directoryTypes";
import type { CommercialInvoice, InvoiceAddress, InvoiceLineItem } from "../domain/types";

const EMPTY_ADDRESS: InvoiceAddress = { companyId: null, companyName: "", contactName: "", address: "", country: "", eori: "", vat: "", ein: "", telephone: "", email: "", notes: "" };

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

export function CommercialInvoiceGenerator({
  companies,
  products,
}: {
  companies: InvoiceCompany[];
  products: ProductTypeInvoiceOption[];
}) {
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
      feedback.exportCreated();
    } catch {
      feedback.exportFailed();
    } finally {
      setExporting(null);
    }
  }

  function updateLine(id: string, field: keyof InvoiceLineItem, value: string) {
    setInvoice((current) => ({
      ...current,
      lineItems: current.lineItems.map((item) => {
        if (item.id !== id) return item;
        const next = {
          ...item,
          ...(field === "product"
            ? manuallyEditInvoiceName(item, value)
            : { [field]: value }),
        };
        return field === "product" || field === "type" || field === "description" ? applyOriginRule(next) : next;
      }),
    }));
  }

  function selectCompany(target: "sender" | "receiver", company: InvoiceCompany) {
    setInvoice((current) => ({
      ...current,
      [target]: selectInvoiceCompany(current[target], company),
    }));
  }

  function updateCompanyName(target: "sender" | "receiver", value: string) {
    setInvoice((current) => ({
      ...current,
      [target]: manuallyEditInvoiceCompanyName(current[target], value),
    }));
  }

  function clearCompany(target: "sender" | "receiver") {
    updateCompanyName(target, "");
  }

  function selectProduct(id: string, product: ProductTypeInvoiceOption) {
    setInvoice((current) => ({
      ...current,
      lineItems: current.lineItems.map((item) => {
        if (item.id !== id) return item;
        // A saved product wins for a nonblank origin. If it is blank, the
        // existing W101 rule may fill China; manual nonblank origins remain untouched.
        return applyOriginRule(
          selectProductType(item, product, current.details.currency),
        );
      }),
    }));
  }

  return (
    <div className="grid min-w-0 gap-4">
      <div className="no-print flex min-w-0 flex-wrap gap-2">
        <ActionMenu label="Export" pending={Boolean(exporting)} items={[{ label: "Export Excel", onSelect: () => void runExport("xlsx") }, { label: "Export PDF", onSelect: () => void runExport("pdf") }]} />
        <button type="button" onClick={reset} className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-border bg-background px-3 text-sm font-medium text-foreground transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><RotateCcw className="size-4" />Reset</button>
      </div>

      <InvoiceForm
        invoice={invoice}
        errors={errors}
        companies={companies}
        products={products}
        onDetailsChange={(field, value) => setInvoice((current) => ({ ...current, details: { ...current.details, [field]: value } }))}
        onAddressChange={(target, field, value) => setInvoice((current) => ({ ...current, [target]: { ...current[target], [field]: value } }))}
        onCompanySelect={selectCompany}
        onCompanyNameChange={updateCompanyName}
        onCompanyClear={clearCompany}
        onLineChange={updateLine}
        onProductSelect={selectProduct}
        onAddLine={() => setInvoice((current) => ({ ...current, lineItems: addLineItem(current.lineItems, createId()) }))}
        onRemoveLine={(id) => setInvoice((current) => ({ ...current, lineItems: removeLineItem(current.lineItems, id) }))}
      />

      <section className="grid gap-3">
        <h2 className="text-sm font-semibold">Preview</h2>
        <Surface className="max-w-full overflow-x-auto bg-muted p-[var(--hub-compact-card-padding)] sm:p-[var(--hub-card-padding)]"><InvoicePreview invoice={calculated} /></Surface>
      </section>
    </div>
  );
}
