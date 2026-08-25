import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { hubFeatureNavigation, hubProfileNavigation } from "./hubNavigation.ts";

test("defines every Hub feature card from shared navigation", () => {
  assert.deepEqual(
    hubFeatureNavigation.map(({ label, href }) => ({ label, href })),
    [
      { label: "Sales Dashboard", href: "/hub/sales-dashboard" },
      { label: "Analytics", href: "/hub/analytics" },
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
    { label: "UK Standard", href: "/hub/calculators/uk/standard" },
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

test("defines the Profile route separately for placement beside sign out", () => {
  assert.deepEqual({ label: hubProfileNavigation.label, href: hubProfileNavigation.href }, { label: "Profile", href: "/hub/profile" });
  assert.equal(hubFeatureNavigation.some((item) => item.href === "/hub/profile"), false);
});

test("sidebar account area keeps only Profile and sign out", () => {
  const sidebar = readFileSync(new URL("../components/layout/SidebarNav.tsx", import.meta.url), "utf8");
  assert.match(sidebar, /hubProfileNavigation/);
  assert.match(sidebar, /<LogoutButton \/>/);
  assert.doesNotMatch(sidebar, /Signed in/);
  assert.doesNotMatch(sidebar, /\{organisationRole/);
});
