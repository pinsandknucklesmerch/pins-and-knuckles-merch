import assert from "node:assert/strict";
import test from "node:test";
import { calculatePkTax } from "../domain/calculatePkTax.ts";
import { formatPkTaxExport } from "../domain/exportPkTax.ts";
import { type PkTaxInput } from "../domain/types.ts";

function input(overrides: Partial<PkTaxInput> = {}): PkTaxInput {
  return { EPCC: 0, Johan: 0, Bux: 0, Hardus: 0, Shannon: 0, Justin: 0, Snuggle: 0, ...overrides };
}

test("all zero inputs produce zero allocations", () => {
  const result = calculatePkTax(input());
  assert.equal(result.totalInput, 0);
  assert.equal(result.totalAllocated, 0);
  assert.equal(result.poolBalance, 0);
});

test("EPCC and Johan use 40% direct allocations", () => {
  const result = calculatePkTax(input({ EPCC: 100, Johan: 50 }));
  assert.equal(result.epccAllocation, 40);
  assert.equal(result.johanAllocation, 20);
});

test("pool contributions use the legacy rates", () => {
  const result = calculatePkTax(input({ Bux: 100, Hardus: 50, Shannon: 25, Justin: 75, Snuggle: 200 }));
  assert.deepEqual(result.contributions.map(({ person }) => person), ["Bux", "Hardus", "Shannon", "Justin", "Snuggle"]);
  assert.deepEqual(result.contributions.map(({ amount }) => Number(amount.toFixed(2))), [40, 20, 10, 30, 14]);
  assert.equal(result.poolTotal, 114);
});

test("Shannon contributes but does not receive", () => {
  const result = calculatePkTax(input({ Shannon: 100 }));
  assert.equal(result.contributions.find((row) => row.person === "Shannon")?.amount, 40);
  assert.deepEqual(result.recipientAllocations.map((row) => row.person), ["Bux", "Hardus", "Justin"]);
});

test("Snuggle contributes at 7%", () => {
  assert.equal(calculatePkTax(input({ Snuggle: 1000 })).poolTotal, 70);
});

test("the remaining pool is split equally between Bux, Hardus, and Justin", () => {
  const result = calculatePkTax(input({ Bux: 100, Hardus: 100, Justin: 100 }));
  assert.deepEqual(result.recipientAllocations.map((row) => row.amount), [40, 40, 40]);
});

test("Seth is absent from every output", () => {
  const result = calculatePkTax(input({ Bux: 100 }));
  assert.equal("Seth" in result.inputs, false);
  assert.equal(JSON.stringify(result).includes("Seth"), false);
});

test("Admin, Marketing, and Operations use the PK Tax base", () => {
  const result = calculatePkTax(input({ EPCC: 100, Johan: 100, Snuggle: 100 }));
  assert.equal(result.adminAllocation, 20);
  assert.equal(result.marketingAllocation, 10);
  assert.equal(result.operationsAllocation, 10);
});

test("decimal calculations retain precision until display", () => {
  const result = calculatePkTax(input({ Snuggle: 100, Bux: 1 }));
  assert.equal(result.contributions.find((row) => row.person === "Snuggle")?.amount.toFixed(2), "7.00");
  assert.equal(result.recipientAllocations[0].amount, 2.4666666666666672);
});

test("total allocated and pool balance reconcile", () => {
  const result = calculatePkTax(input({ EPCC: 100, Johan: 50, Bux: 100, Hardus: 50, Shannon: 25, Justin: 75, Snuggle: 200 }));
  assert.equal(result.totalAllocated, 40 + 20 + 114 + 40 + 20 + 20);
  assert.equal(result.poolBalance, 0);
});

test("realistic report example exports all required sections", () => {
  const exportText = formatPkTaxExport(calculatePkTax(input({ EPCC: 1200, Johan: 900, Bux: 800, Hardus: 600, Shannon: 400, Justin: 700, Snuggle: 1500 })));
  for (const label of ["EPCC", "Johan", "Bux", "Hardus", "Shannon", "Justin", "Snuggle", "Pool total", "Admin", "Marketing", "Operations", "Total input", "Total allocated", "Pool balance / difference"]) {
    assert.equal(exportText.includes(label), true, label);
  }
  assert.equal(exportText.includes("Seth"), false);
});
