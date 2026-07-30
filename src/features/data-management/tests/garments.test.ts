import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import type { SupabaseClient } from "@supabase/supabase-js";
import { canDeactivateGarment, deactivateGarmentRecord } from "../lib/deactivateGarment.ts";
import { fetchAllGarmentPages, formatGarmentCurrency, garmentAriaSort, nextGarmentSort, sortGarments } from "../lib/garments.ts";
import type { GarmentRecord } from "../types.ts";

const garment = (id: string, code: string, eurBasePrice: number | null, gbpPrice: number | null): GarmentRecord => ({ id, code, altCode: null, brand: null, name: code, colour: null, tags: null, eurBasePrice, gbpPrice, extraSizeCost: null, isActive: true, productTypeId: null, productTypeName: null });

test("loads every active garment across deterministic pages", async () => {
  const rows = Array.from({ length: 74 }, (_, index) => `G${String(index).padStart(3, "0")}`);
  const ranges: [number, number][] = [];
  const result = await fetchAllGarmentPages(async (from, to) => { ranges.push([from, to]); return rows.slice(from, to + 1); }, 50);
  assert.equal(result.length, 74);
  assert.deepEqual(ranges, [[0, 49], [50, 99]]);
  assert.equal(result[0], "G000");
  assert.equal(result.at(-1), "G073");
});

test("formats garment currencies with symbols, two decimals, and null placeholders", () => {
  assert.equal(formatGarmentCurrency(12, "EUR"), "€12.00");
  assert.equal(formatGarmentCurrency(12.5, "GBP"), "£12.50");
  assert.equal(formatGarmentCurrency(0, "EUR"), "€0.00");
  assert.equal(formatGarmentCurrency(null, "EUR"), "—");
});

test("sort state and accessibility values represent neutral, ascending, and descending headers", () => {
  assert.deepEqual(nextGarmentSort("code", "asc", "code"), { key: "code", direction: "desc" });
  assert.deepEqual(nextGarmentSort("code", "desc", "brand"), { key: "brand", direction: "asc" });
  assert.equal(garmentAriaSort(false, "asc"), "none");
  assert.equal(garmentAriaSort(true, "asc"), "ascending");
  assert.equal(garmentAriaSort(true, "desc"), "descending");
  assert.deepEqual(sortGarments([garment("1", "B", 10, null), garment("2", "A", 20, null)], "code", "asc").map((item) => item.code), ["A", "B"]);
  assert.deepEqual(sortGarments([garment("1", "B", 10, null), garment("2", "A", 20, null)], "code", "desc").map((item) => item.code), ["B", "A"]);
});

function deactivationClient(row: { id: string; is_active: boolean } | null, readError = false, updateError = false) {
  const updates: unknown[] = [];
  const client = {
    from: () => ({
      select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: row, error: readError ? { message: "read" } : null }) }) }),
      update: (payload: unknown) => ({ eq: async () => { updates.push(payload); return { error: updateError ? { message: "update" } : null }; } }),
    }),
  } as unknown as SupabaseClient;
  return { client, updates };
}

test("deactivation updates only is_active and never performs a hard delete", async () => {
  const { client, updates } = deactivationClient({ id: "garment-1", is_active: true });
  assert.equal(await deactivateGarmentRecord(client as never, "garment-1"), "deactivated");
  assert.deepEqual(updates, [{ is_active: false }]);
});

test("deactivation reports missing, inactive, and database failure states", async () => {
  assert.equal(await deactivateGarmentRecord(deactivationClient(null).client as never, "missing"), "not_found");
  assert.equal(await deactivateGarmentRecord(deactivationClient({ id: "inactive", is_active: false }).client as never, "inactive"), "already_inactive");
  assert.equal(await deactivateGarmentRecord(deactivationClient({ id: "broken", is_active: true }, false, true).client as never, "broken"), "database_error");
});

test("only administrators can deactivate garments", () => {
  assert.equal(canDeactivateGarment("admin"), true);
  assert.equal(canDeactivateGarment("write"), false);
  assert.equal(canDeactivateGarment("read"), false);
  assert.equal(canDeactivateGarment(null), false);
});

test("active table uses the in-app deactivation dialog without a Status column", () => {
  const component = readFileSync("src/features/data-management/components/GarmentsManager.tsx", "utf8");
  assert.doesNotMatch(component, /window\.confirm|>Status<|label="Status"|Delete/);
  assert.match(component, /<dialog|Deactivate garment|This garment will no longer appear in calculators or the active garment list\./);
  assert.match(component, /aria-sort=|ArrowDownUp|ArrowUp|ArrowDown/);
  assert.match(component, /\[&>option\]:bg-card/);
});

test("garment actions deactivate without deletion and the catalog requests active rows only", () => {
  const actions = readFileSync("src/features/data-management/actions.ts", "utf8");
  const deactivateAction = actions.slice(actions.indexOf("export async function deactivateGarment"));
  const catalog = readFileSync("src/features/data-management/data/catalog.ts", "utf8");
  assert.doesNotMatch(deactivateAction, /\.delete\(/);
  assert.match(deactivateAction, /canDeactivateGarment\(accessLevel\)/);
  assert.match(catalog, /\.eq\("is_active", true\)/);
});
