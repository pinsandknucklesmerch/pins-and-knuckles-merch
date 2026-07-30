import assert from "node:assert/strict";
import test from "node:test";
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
