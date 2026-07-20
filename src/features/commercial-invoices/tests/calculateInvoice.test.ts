import assert from "node:assert/strict";
import test from "node:test";
import {
  addLineItem,
  calculateInvoice,
  calculateLineTotal,
  createLineItem,
  parseNonNegativeNumber,
  removeLineItem,
  validateInvoice,
} from "../domain/calculateInvoice.ts";
import { getExportFilename } from "../domain/exportInvoice.ts";
import type { CommercialInvoice, InvoiceLineItem } from "../domain/types.ts";

function line(id: string, cost: string, quantity: string): InvoiceLineItem {
  return { ...createLineItem(id), product: "T-shirt", cost, quantity };
}

function invoice(lines: InvoiceLineItem[]): CommercialInvoice {
  return {
    details: { reference: "INV 10/24", date: "2026-07-20", shipDate: "2026-07-20", tracking: "", boxCount: "", weight: "18 kg", currency: "GBP", printLocation: "United Kingdom", dutiesPayableBy: "Receiver" },
    sender: { companyName: "Sender", contactName: "", address: "One Road", country: "", eori: "", vat: "", ein: "", telephone: "", email: "", notes: "" },
    receiver: { companyName: "Receiver", contactName: "", address: "Two Road", country: "", eori: "", vat: "", ein: "", telephone: "", email: "", notes: "" },
    lineItems: lines,
  };
}

test("calculates one line item total", () => assert.equal(calculateLineTotal(line("1", "12.50", "4")), 50));
test("calculates multiple line-item subtotal", () => assert.equal(calculateInvoice(invoice([line("1", "3", "2"), line("2", "4.5", "3")])).totals.subtotal, 19.5));
test("legacy invoice adds no freight or shipping charge", () => { const result = calculateInvoice(invoice([line("1", "10", "2")])); assert.equal(result.totals.grandTotal, result.totals.subtotal); });
test("legacy invoice applies no VAT or tax calculation", () => { const result = calculateInvoice(invoice([line("1", "10", "2")])); assert.equal(result.totals.grandTotal, 20); });
test("grand total equals the rounded line-item subtotal", () => assert.equal(calculateInvoice(invoice([line("1", "2.25", "4")])).totals.grandTotal, 9));
test("calculates total quantity", () => assert.equal(calculateInvoice(invoice([line("1", "1", "2"), line("2", "1", "3")])).totals.totalQuantity, 5));
test("preserves legacy header weight without inventing a line-weight total", () => assert.equal(calculateInvoice(invoice([line("1", "1", "1")])).details.weight, "18 kg"));
test("rounds monetary results to two decimal places", () => assert.equal(calculateLineTotal(line("1", "0.333", "3")), 1));
test("blank optional numeric values safely resolve to zero", () => assert.equal(parseNonNegativeNumber(""), 0));
test("invalid negative values resolve to zero and fail validation", () => { assert.equal(parseNonNegativeNumber("-2"), 0); assert.equal(validateInvoice(invoice([line("1", "-2", "1")]))["1.cost"], "Enter 0 or more"); });
test("adds and removes stable line items without removing the final row", () => { const first = createLineItem("one"); const added = addLineItem([first], "two"); assert.deepEqual(added.map((item) => item.id), ["one", "two"]); assert.deepEqual(removeLineItem(added, "one").map((item) => item.id), ["two"]); assert.equal(removeLineItem([first], "one").length, 1); });
test("uses the legacy sanitized export filename", () => { const calculated = calculateInvoice(invoice([line("1", "1", "1")])); assert.equal(getExportFilename(calculated, "xlsx"), "commercial-invoice-inv-10-24.xlsx"); assert.equal(getExportFilename(calculated, "pdf"), "commercial-invoice-inv-10-24.pdf"); });
