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
      { label: "Data Management", href: "/hub/data" },
    ],
  );
});

test("defines one level of child routes for grouped navigation", () => {
  const calculators = hubFeatureNavigation.find((item) => item.href === "/hub/calculators");
  const data = hubFeatureNavigation.find((item) => item.href === "/hub/data");
  assert.deepEqual(calculators?.children?.map(({ label, href }) => ({ label, href })), [
    { label: "EU Standard", href: "/hub/calculators/eu/standard" },
    { label: "EU US Clients", href: "/hub/calculators/eu/us-clients" },
    { label: "UK Trade", href: "/hub/calculators/uk/trade" },
  ]);
  assert.deepEqual(data?.children?.map(({ label, href }) => ({ label, href })), [
    { label: "Garments", href: "/hub/data/garments" },
    { label: "Product Types", href: "/hub/data/product-types" },
    { label: "Invoice Companies", href: "/hub/data/invoice-companies" },
  ]);
});

test("does not expose the retired Invoice Products route", () => {
  const data = hubFeatureNavigation.find((item) => item.href === "/hub/data");
  assert.equal(data?.children?.some((item) => item.href === "/hub/data/invoice-products"), false);
});

test("does not expose Dashboard as a feature card or duplicate routes", () => {
  const hrefs = hubFeatureNavigation.map((item) => item.href);
  assert.equal(hrefs.includes("/hub"), false);
  assert.equal(new Set(hrefs).size, hrefs.length);
});
