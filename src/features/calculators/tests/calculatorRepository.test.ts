import assert from "node:assert/strict";
import test from "node:test";
import {
  isEffectiveOnDate,
  isEuScopedRow,
} from "../data/calculatorRepository.ts";
import { mapEuPrintPriceTier, mapGarment } from "../data/mappers.ts";
import type { Tables } from "@/types/database.types";

test("active row inside validity window is included", () => {
  assert.equal(
    isEffectiveOnDate(
      { valid_from: "2026-01-01", valid_to: "2026-12-31" },
      "2026-07-16",
    ),
    true,
  );
});

test("future valid_from row is excluded", () => {
  assert.equal(
    isEffectiveOnDate(
      { valid_from: "2026-07-17", valid_to: null },
      "2026-07-16",
    ),
    false,
  );
});

test("expired valid_to row is excluded", () => {
  assert.equal(
    isEffectiveOnDate(
      { valid_from: "2026-01-01", valid_to: "2026-07-15" },
      "2026-07-16",
    ),
    false,
  );
});

test("null valid_to row is included when valid_from has started", () => {
  assert.equal(
    isEffectiveOnDate(
      { valid_from: "2026-01-01", valid_to: null },
      "2026-07-16",
    ),
    true,
  );
});

test("UK GBP pricing rows are not EU scoped", () => {
  assert.equal(isEuScopedRow({ region: "UK", currency_code: "GBP" }), false);
  assert.equal(isEuScopedRow({ region: "EU", currency_code: "EUR" }), true);
});

test("numeric strings are converted correctly at the mapper boundary", () => {
  const garment = mapGarment({
    id: "garment-1",
    organisation_id: null,
    code: "GD01",
    alt_code: "64000",
    brand_name: "Gildan",
    name: "Gildan SoftStyle Adult T-Shirt",
    colour: "Colours",
    garment_type: "TSHIRT",
    eur_base_price: "2.2500",
    gbp_price: null,
    extra_size_cost: "0.7000",
    tags: "",
    is_active: true,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  } as unknown as Tables<"garments">);

  assert.equal(garment.eurBasePrice, 2.25);
  assert.equal(garment.gbpPrice, null);
  assert.equal(garment.extraSizeCost, 0.7);
});

test("invalid numeric strings produce a clear field error", () => {
  assert.throws(
    () =>
      mapEuPrintPriceTier({
        id: "tier-1",
        organisation_id: null,
        pricing_set_code: "EU_SCREEN_PRINT_V1",
        price_kind: "print",
        region: "EU",
        colour_count: 1,
        quantity_min: 50,
        quantity_max: 99,
        production_unit_price: "not-a-number",
        customer_unit_price: "1.5400",
        currency_code: "EUR",
        valid_from: "2026-01-01",
        valid_to: null,
        is_active: true,
        created_at: "2026-01-01T00:00:00Z",
        updated_at: "2026-01-01T00:00:00Z",
      } as unknown as Tables<"eu_print_price_tiers">),
    /eu_print_price_tiers\.production_unit_price/,
  );
});
