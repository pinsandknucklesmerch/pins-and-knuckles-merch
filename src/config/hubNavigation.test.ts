import assert from "node:assert/strict";
import test from "node:test";
import { hubFeatureNavigation } from "./hubNavigation.ts";

test("defines every Hub feature card from shared navigation", () => {
  assert.deepEqual(
    hubFeatureNavigation.map(({ label, href }) => ({ label, href })),
    [
      { label: "Sales Dashboard", href: "/hub/sales-dashboard" },
      { label: "Calculators", href: "/hub/calculators" },
      { label: "PK Tax", href: "/hub/pk-tax" },
      {
        label: "Commercial Invoices",
        href: "/hub/commercial-invoices",
      },
    ],
  );
});

test("does not expose Dashboard as a feature card or duplicate routes", () => {
  const hrefs = hubFeatureNavigation.map((item) => item.href);
  assert.equal(hrefs.includes("/hub"), false);
  assert.equal(new Set(hrefs).size, hrefs.length);
});
