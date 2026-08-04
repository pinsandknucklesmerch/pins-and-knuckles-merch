import assert from "node:assert/strict";
import test from "node:test";
import { manuallyEditInvoiceName, selectProductType } from "../domain/invoiceDirectorySelection.ts";
import type { ProductTypeInvoiceOption } from "../domain/directoryTypes.ts";
import type { InvoiceLineItem } from "../domain/types.ts";

const line = (overrides: Partial<InvoiceLineItem> = {}): InvoiceLineItem => ({ id: "line-1", productTypeId: "old", product: "Old", designName: "Design", type: "Old type", description: "Old description", cost: "9", quantity: "3", commodityCode: "old-code", countryOfOrigin: "Honduras", ...overrides });
const product = (overrides: Partial<ProductTypeInvoiceOption> = {}): ProductTypeInvoiceOption => ({ id: "type-1", name: "W101", pricingCategory: "TSHIRT", commodityCode: "42029298", countryOfOrigin: "China", invoiceDescription: "Cotton tote", defaultInvoiceCost: 2.5, invoiceCurrencyCode: "GBP", isActive: true, ...overrides });

test("Product Type selection maps invoice fields without mutating the source", () => {
  const source = product();
  const selected = selectProductType(line(), source, "GBP");
  assert.equal(selected.productTypeId, "type-1");
  assert.equal(selected.product, "W101");
  assert.equal(selected.type, "TSHIRT");
  assert.equal(selected.description, "Cotton tote");
  assert.equal(selected.cost, "2.5");
  assert.equal(selected.quantity, "3");
  assert.deepEqual(source, product());
});

test("matching currency applies the default cost and mismatch preserves local cost", () => {
  assert.equal(selectProductType(line(), product(), "GBP").cost, "2.5");
  assert.equal(selectProductType(line(), product(), "EUR").cost, "9");
  assert.equal(selectProductType(line(), product({ defaultInvoiceCost: null }), "GBP").cost, "9");
});

test("blank customs values preserve blank invoice fields", () => {
  const selected = selectProductType(line({ commodityCode: "", countryOfOrigin: "" }), product({ commodityCode: "", countryOfOrigin: "", invoiceDescription: "" }), "GBP");
  assert.equal(selected.commodityCode, "");
  assert.equal(selected.countryOfOrigin, "");
  assert.equal(selected.description, "");
});

test("manual Product edits clear Product Type provenance", () => {
  const edited = manuallyEditInvoiceName(line(), "Unlisted product");
  assert.equal(edited.productTypeId, null);
  assert.equal(edited.product, "Unlisted product");
});

test("duplicate commodity codes remain separate Product Type selections", () => {
  const first = product({ id: "type-1", name: "T-shirt A" });
  const second = product({ id: "type-2", name: "T-shirt B" });
  assert.equal(selectProductType(line(), first, "GBP").productTypeId, "type-1");
  assert.equal(selectProductType(line(), second, "GBP").productTypeId, "type-2");
});
