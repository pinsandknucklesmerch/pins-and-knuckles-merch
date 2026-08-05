import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const migration = readFileSync(new URL("../../../../supabase/migrations/20260805120000_update_global_garment_catalogue_prices.sql", import.meta.url), "utf8");

test("authoritative garment migration contains the required EUR, GBP, and shared extra-size values", () => {
  assert.match(migration, /'GD01\/colours'.*2\.2500, 1\.9600, 0\.7000/);
  assert.match(migration, /'JH001\/whites'.*9\.5000, 7\.2400, 1\.5000/);
  assert.match(migration, /'4089\/null'.*7\.6000, null, null/);
  assert.match(migration, /'STTU169\/white'.*4\.1300, 2\.3200, 1\.0000/);
});

test("authoritative garment migration keeps colour variants distinct and normalizes brands", () => {
  assert.equal((migration.match(/^  \('W101\//gm) ?? []).length, 2);
  assert.equal((migration.match(/^  \('CV3001\//gm) ?? []).length, 2);
  assert.match(migration, /'W101\/white-natural'.*'White \/ Natural'/);
  assert.match(migration, /'W101\/colours'.*'Colours'/);
  assert.match(migration, /'CV3001\/colours'.*'Colours'/);
  assert.match(migration, /'CV3001\/whites'.*'Whites'/);
  assert.match(migration, /'STTU976\/colours'.*'Stanley\/Stella'/);
  assert.match(migration, /'W606\/null'.*'Westford Mill'/);
});

test("authoritative garment migration protects unique matches and preserves matched classifications", () => {
  assert.match(migration, /having count\(target\.id\) > 1/);
  assert.match(migration, /target\.organisation_id is null/);
  assert.match(migration, /source\.colour is null and nullif\(trim\(coalesce\(target\.colour, ''\)\), ''\) is null/);
  const updateBlock = migration.slice(migration.indexOf('update public.garments target'), migration.indexOf('returning source.source_row, target.id'));
  assert.doesNotMatch(updateBlock, /product_type_id|garment_type|is_active|tags/);
  assert.match(migration, /join resolved_product_types resolved/);
});

test("authoritative garment migration deactivates only the three obsolete global legacy rows", () => {
  assert.match(migration, /B653 legacy deactivation resolves to multiple global garments/);
  assert.match(migration, /blank-colour W101 deactivation resolves to multiple global garments/);
  assert.match(migration, /GD05 Whites deactivation resolves to multiple global garments/);
  const deactivationBlock = migration.slice(migration.indexOf('with deactivated as'), migration.indexOf("select source_row, id, 'DEACTIVATE'"));
  assert.match(deactivationBlock, /set is_active = false/);
  assert.doesNotMatch(deactivationBlock, /set[\s\S]*?(?:product_type_id|eur_base_price|gbp_price|name|tags)\s*=/);
  assert.match(deactivationBlock, /'b653'/);
  assert.match(deactivationBlock, /'w101'/);
  assert.match(deactivationBlock, /'gd05'/);
  assert.match(deactivationBlock, /nullif\(trim\(coalesce\(target\.colour, ''\)\), ''\) is null/);
  assert.match(deactivationBlock, /'whites'/);
});

test("authoritative variants remain outside the legacy deactivation selectors", () => {
  assert.match(migration, /'BB653\/null'/);
  assert.match(migration, /'W101\/white-natural'/);
  assert.match(migration, /'W101\/colours'/);
  assert.match(migration, /'GD05\/colours'/);
  assert.match(migration, /'GD05\/white-natural'/);
  assert.match(migration, /operation in \('UPDATE', 'INSERT', 'DEACTIVATE'\)/);
});
