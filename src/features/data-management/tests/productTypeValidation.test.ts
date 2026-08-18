import assert from "node:assert/strict";
import test from "node:test";
import { normaliseCommodityCode, validateProductTypeInvoiceFields } from "../lib/productTypeValidation.ts";

const values = (overrides: Partial<Parameters<typeof validateProductTypeInvoiceFields>[0]> = {}) => ({ commodityCode: "", countryOfOrigin: "", invoiceDescription: "", defaultInvoiceCost: "2.5000", invoiceCurrencyCode: "GBP", ...overrides });

test("Product Type invoice fields allow blanks and valid currencies", () => {
  assert.deepEqual(validateProductTypeInvoiceFields(values({ defaultInvoiceCost: "", invoiceCurrencyCode: "" })).errors, {});
  assert.equal(validateProductTypeInvoiceFields(values()).values?.defaultInvoiceCost, 2.5);
  assert.equal(validateProductTypeInvoiceFields(values({ invoiceCurrencyCode: "EUR" })).values?.invoiceCurrencyCode, "EUR");
});

test("Product Type invoice fields reject invalid costs and currencies", () => {
  assert.equal(validateProductTypeInvoiceFields(values({ defaultInvoiceCost: "-1" })).errors.defaultInvoiceCost, "Default invoice cost must be a nonnegative number.");
  assert.equal(validateProductTypeInvoiceFields(values({ defaultInvoiceCost: "nope" })).errors.defaultInvoiceCost, "Default invoice cost must be a nonnegative number.");
  assert.equal(validateProductTypeInvoiceFields(values({ invoiceCurrencyCode: "USD" })).errors.invoiceCurrencyCode, "Invoice currency must be GBP or EUR.");
});

test("normalises commodity code whitespace while preserving leading zeroes", () => {
  assert.equal(normaliseCommodityCode(" 05810 99 90 "), "058109990");
});
