import assert from "node:assert/strict";
import test from "node:test";
import { WEIGHTS, calculatePkTax, createDefaultPkTaxInput } from "../domain/calculatePkTax.ts";
import { formatPkTaxExport } from "../domain/exportPkTax.ts";
import type { PkTaxInput } from "../domain/types.ts";

function input(overrides: Partial<PkTaxInput> = {}): PkTaxInput {
  const defaults = createDefaultPkTaxInput();
  return {
    ...defaults,
    ...overrides,
    pkTaxBroughtIn: { ...defaults.pkTaxBroughtIn, ...overrides.pkTaxBroughtIn },
    performance: {
      ...defaults.performance,
      ...Object.fromEntries(Object.entries(overrides.performance ?? {}).map(([person, values]) => [person, { ...defaults.performance[person as keyof typeof defaults.performance], ...values }])),
    },
  };
}

function withPerformance(overrides: Partial<PkTaxInput> = {}) {
  return input({
    pkTaxBroughtIn: { Hardus: 100, Justin: 100, Bux: 100, Shannon: 0, ...overrides.pkTaxBroughtIn },
    performance: {
      Hardus: { companyProfit: 100, snuggleProfit: 100, ordersHandled: 100 },
      Justin: { companyProfit: 100, snuggleProfit: 100, ordersHandled: 100 },
      Bux: { companyProfit: 100, snuggleProfit: 100, ordersHandled: 100 },
      ...overrides.performance,
    },
    ...overrides,
  });
}

test("fixed allocations use approved overall and Johan rates", () => {
  const result = calculatePkTax(withPerformance({ overallTotal: 1000, johanPkTax: 500 }));
  assert.equal(result.epccAllocation, 400);
  assert.equal(result.adminAllocation, 100);
  assert.equal(result.marketingAllocation, 50);
  assert.equal(result.operationsAllocation, 50);
  assert.equal(result.johanAllocation, 200);
});

test("pool includes every approved contributor and Snuggle", () => {
  const result = calculatePkTax(withPerformance({ totalSnuggleProfit: 1000, pkTaxBroughtIn: { Hardus: 100, Justin: 200, Bux: 300, Shannon: 400 } }));
  assert.deepEqual(result.contributions.map(({ person }) => person), ["Hardus", "Justin", "Bux", "Shannon", "Snuggle"]);
  assert.deepEqual(result.contributions.map(({ amount }) => amount), [40, 80, 120, 160, 70]);
  assert.equal(result.salesTeamContribution, 400);
  assert.equal(result.snuggleContribution, 70);
  assert.equal(result.poolTotal, 470);
});

test("Shannon contributes but never receives an allocation", () => {
  const result = calculatePkTax(withPerformance({ pkTaxBroughtIn: { Hardus: 100, Justin: 100, Bux: 100, Shannon: 100 } }));
  assert.equal(result.contributions.find((row) => row.person === "Shannon")?.amount, 40);
  assert.deepEqual(result.recipientAllocations.map((row) => row.person), ["Hardus", "Justin", "Bux"]);
  assert.equal(JSON.stringify(result.recipientAllocations).includes("Shannon"), false);
});

test("metric weights are exactly 40/25/20/15", () => {
  assert.deepEqual(WEIGHTS, { companyProfit: 0.4, snuggleProfit: 0.25, pkTax: 0.2, ordersHandled: 0.15 });
});

test("weighted scores match the specification example", () => {
  const result = calculatePkTax(input({
    pkTaxBroughtIn: { Hardus: 45, Justin: 35, Bux: 20, Shannon: 0 },
    performance: {
      Hardus: { companyProfit: 55, snuggleProfit: 50, ordersHandled: 50 },
      Justin: { companyProfit: 35, snuggleProfit: 30, ordersHandled: 30 },
      Bux: { companyProfit: 10, snuggleProfit: 20, ordersHandled: 20 },
    },
  }));
  assert.deepEqual(result.recipientAllocations.map((allocation) => Number((allocation.weightedScore * 100).toFixed(2))), [51, 33, 16]);
});

test("weighted scores normalize to one and allocate the full pool", () => {
  const result = calculatePkTax(withPerformance({ totalSnuggleProfit: 100, pkTaxBroughtIn: { Hardus: 100, Justin: 50, Bux: 25, Shannon: 25 } }));
  assert.equal(result.validationError, null);
  assert.equal(Number(result.recipientAllocations.reduce((sum, allocation) => sum + allocation.weightedScore, 0).toFixed(12)), 1);
  assert.equal(result.recipientAllocations.reduce((sum, allocation) => sum + (allocation.amount ?? 0), 0), Number(result.poolTotal.toFixed(2)));
});

test("zero-valued individual metrics contribute zero shares without failing valid performance", () => {
  const result = calculatePkTax(withPerformance({
    totalSnuggleProfit: 0.1,
    performance: {
      Hardus: { companyProfit: 10, snuggleProfit: 0, ordersHandled: 0 },
      Justin: { companyProfit: 0, snuggleProfit: 0, ordersHandled: 0 },
      Bux: { companyProfit: 0, snuggleProfit: 0, ordersHandled: 0 },
    },
  }));
  assert.equal(result.validationError, null);
  assert.equal(result.recipientAllocations[0].metricShares.snuggleProfit, 0);
  assert.equal(result.recipientAllocations[0].metricShares.ordersHandled, 0);
});

test("all-zero performance data returns an error and does not allocate the pool", () => {
  const result = calculatePkTax(input({ pkTaxBroughtIn: { Hardus: 0, Justin: 0, Bux: 0, Shannon: 100 } }));
  assert.equal(result.validationError, "Performance data required.");
  assert.deepEqual(result.recipientAllocations.map((allocation) => allocation.amount), [null, null, null]);
});

test("currency remainder goes to the highest unrounded allocation with stable recipient order", () => {
  const result = calculatePkTax(withPerformance({
    totalSnuggleProfit: 0.1,
    pkTaxBroughtIn: { Hardus: 1, Justin: 1, Bux: 1, Shannon: 0 },
    performance: {
      Hardus: { companyProfit: 1, snuggleProfit: 1, ordersHandled: 1 },
      Justin: { companyProfit: 1, snuggleProfit: 1, ordersHandled: 1 },
      Bux: { companyProfit: 1, snuggleProfit: 1, ordersHandled: 1 },
    },
  }));
  assert.deepEqual(result.recipientAllocations.map((allocation) => allocation.amount), [0.41, 0.4, 0.4]);
});

test("Seth is absent from types, results, and export", () => {
  const result = calculatePkTax(withPerformance());
  const exported = formatPkTaxExport(result);
  assert.equal(JSON.stringify(result).includes("Seth"), false);
  assert.equal(exported.includes("Seth"), false);
});

test("export includes fixed allocations, pool composition, and weighted allocations", () => {
  const exported = formatPkTaxExport(calculatePkTax(withPerformance()));
  for (const label of ["Fixed allocations", "EPCC", "Admin", "Marketing", "Ops", "Johan", "Sales-team PK Tax contribution", "Snuggle contribution", "Total PK pool", "Company profit share", "Snuggle profit share", "PK Tax share", "Orders share", "Final weighted score", "Hardus", "Justin", "Bux"]) {
    assert.equal(exported.includes(label), true, label);
  }
  assert.equal(exported.includes("Shannon pool allocation"), false);
});
