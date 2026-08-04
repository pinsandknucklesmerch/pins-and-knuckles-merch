import assert from "node:assert/strict";
import test from "node:test";
import type { Tables } from "@/types/database.types";
import { mapProductTypeRow } from "../data/invoiceDirectoryMappers.ts";

const row = (overrides: Partial<Tables<"product_types">> = {}): Tables<"product_types"> => ({ id: "type-1", name: "W101", commodity_code: "42029298", country_of_origin: "China", invoice_description: "Tote", default_invoice_cost: 2.5, invoice_currency_code: "GBP", pricing_category: "TSHIRT", is_active: true, created_at: "", updated_at: "", ...overrides });

test("Product Type mapper maps customs fields and numeric defaults", () => {
  assert.deepEqual(mapProductTypeRow(row()), { id: "type-1", name: "W101", pricingCategory: "TSHIRT", commodityCode: "42029298", countryOfOrigin: "China", invoiceDescription: "Tote", defaultInvoiceCost: 2.5, invoiceCurrencyCode: "GBP", isActive: true });
  assert.equal(mapProductTypeRow(row({ default_invoice_cost: "3.1250" as unknown as number })).defaultInvoiceCost, 3.125);
  assert.equal(mapProductTypeRow(row({ default_invoice_cost: null, invoice_currency_code: null })).invoiceCurrencyCode, null);
});

test("Product Type mapper rejects invalid numeric defaults", () => {
  assert.throws(() => mapProductTypeRow(row({ default_invoice_cost: "not-a-number" as unknown as number })), /product_types\.default_invoice_cost/);
});
