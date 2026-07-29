import assert from "node:assert/strict";
import test from "node:test";
import { calculateEuDelivery, formatEuDeliveryCopy } from "../domain/euDeliveryHelper.ts";

const rates = [{ pricingSetCode: "EU_DELIVERY_V1", country: "Germany", currencyCode: "EUR" as const, costPerBox: 25, deliveryTime: "2 days", vatRate: 27 }];

test("EU delivery markup and VAT preserve the legacy calculation", () => {
  const result = calculateEuDelivery({ country: "Germany", boxCount: 2, markupEnabled: true, markupPerBox: 5 }, rates);
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.deliveryBaseExclVat, 50);
  assert.equal(result.deliveryMarkupExclVat, 10);
  assert.equal(result.deliverySubtotalExclVat, 60);
  assert.ok(Math.abs(result.deliveryVatAmount - 16.2) < 1e-9);
  assert.ok(Math.abs(result.deliveryTotalInclVat - 76.2) < 1e-9);
});

test("box count changes delivery only and legacy copy retains its subtotal label", () => {
  const result = calculateEuDelivery({ country: "Germany", boxCount: 2, markupEnabled: false, markupPerBox: 0 }, rates);
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.match(formatEuDeliveryCopy(result), /Cost Per Box: €50\.00 excl\. VAT/);
  assert.match(formatEuDeliveryCopy(result), /Total Delivery Cost Incl\. VAT: €63\.50/);
});

test("delivery validation handles unavailable rates, countries, and box counts", () => {
  assert.deepEqual(calculateEuDelivery({ country: "Germany", boxCount: 1, markupEnabled: false, markupPerBox: 0 }, []), { ok: false, error: "Delivery rates unavailable." });
  assert.deepEqual(calculateEuDelivery({ country: "France", boxCount: 1, markupEnabled: false, markupPerBox: 0 }, rates), { ok: false, error: "Delivery area unavailable." });
  assert.deepEqual(calculateEuDelivery({ country: "Germany", boxCount: 0, markupEnabled: false, markupPerBox: 0 }, rates), { ok: false, error: "Enter a whole number of boxes." });
});
