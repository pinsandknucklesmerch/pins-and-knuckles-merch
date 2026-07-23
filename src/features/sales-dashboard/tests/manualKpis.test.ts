import assert from "node:assert/strict";
import test from "node:test";
import { executeTargetSave, type TargetSaveDependencies } from "../lib/targetSave.ts";
import { getSalesDashboardQueryPlan } from "../lib/queryPlan.ts";
import { mapTargets } from "../data/mappers.ts";
import type { PinsHubAccessResult } from "../../../lib/access/pinsHubAccess.ts";

const adminAccess: PinsHubAccessResult = {
  authenticated: true,
  user: { id: "user-1", email: "admin@example.com" },
  membership: { id: "membership-1", organisation_id: "organisation-1", role: "admin" },
  access: { id: "access-1", organisation_member_id: "membership-1", app_key: "pins_hub", access_level: "admin" },
  error: null,
  queryError: null,
  accessDeniedReason: null,
};

function validForm() {
  const formData = new FormData();
  formData.set("MONTHLY_PROFIT", "155000.50");
  formData.set("QUOTES_DONE", "300");
  formData.set("ORDERS_PROCESSED", "200");
  formData.set("CONVERSION_RATE", "65");
  return formData;
}

function dependencies(overrides: Partial<TargetSaveDependencies> = {}): TargetSaveDependencies {
  return {
    getAccess: async () => adminAccess,
    upsertTargets: async () => ({ error: null }),
    revalidate: () => undefined,
    ...overrides,
  };
}

test("company view skips member-month reads", () => {
  assert.deepEqual(getSalesDashboardQueryPlan("company", true, 2025), {
    companyYears: [2025, 2024], fetchCompany: true, fetchMembers: false, fetchTargets: true,
  });
});

test("member view skips targets and fetches company only for admin entry", () => {
  assert.deepEqual(getSalesDashboardQueryPlan("members", false, 2025), {
    companyYears: [2025], fetchCompany: false, fetchMembers: true, fetchTargets: false,
  });
  assert.equal(getSalesDashboardQueryPlan("members", true, 2025).fetchCompany, true);
});

test("target save rejects unsupported fields before access or writes", async () => {
  const formData = validForm();
  formData.set("monthly_profit", "125000.50");
  let accessCalls = 0;
  const result = await executeTargetSave({ year: 2025, month: 7 }, formData, dependencies({
    getAccess: async () => { accessCalls += 1; return adminAccess; },
  }));
  assert.deepEqual(result, { ok: false, message: "Unsupported target field." });
  assert.equal(accessCalls, 0);
});

test("target save writes configured targets and revalidates exactly once", async () => {
  let targetWrites = 0;
  const paths: string[] = [];
  const result = await executeTargetSave({ year: 2025, month: 7 }, validForm(), dependencies({
    upsertTargets: async (targets, organisationId, effectiveFrom) => {
      targetWrites += 1;
      assert.deepEqual(targets, { MONTHLY_PROFIT: 155000.5, QUOTES_DONE: 300, ORDERS_PROCESSED: 200, CONVERSION_RATE: 65 });
      assert.equal(organisationId, "organisation-1");
      assert.equal(effectiveFrom, "2025-07-01");
      return { error: null };
    },
    revalidate: (path) => paths.push(path),
  }));
  assert.deepEqual(result, { ok: true, message: "Targets updated for this month and future months." });
  assert.equal(targetWrites, 1);
  assert.deepEqual(paths, ["/hub/sales-dashboard"]);
});

test("target save returns a safe database failure and does not revalidate", async () => {
  let revalidations = 0;
  const result = await executeTargetSave({ year: 2025, month: 7 }, validForm(), dependencies({
    upsertTargets: async () => ({ error: { code: "42501", message: "row-level security policy detail" } }),
    revalidate: () => { revalidations += 1; },
  }));
  assert.deepEqual(result, { ok: false, message: "Database access denied." });
  assert.equal(revalidations, 0);
});

test("effective targets update the selected month and all future months without changing June", () => {
  const rows = [
    { organisation_id: null, metric_code: "QUOTES_DONE", target_value: 300, effective_from: "2020-01-01", effective_to: null, is_active: true },
    { organisation_id: "organisation-1", metric_code: "QUOTES_DONE", target_value: 320, effective_from: "2025-01-01", effective_to: null, is_active: true },
    { organisation_id: "organisation-1", metric_code: "QUOTES_DONE", target_value: 340, effective_from: "2025-07-01", effective_to: null, is_active: true },
  ];
  assert.equal(mapTargets(rows, "organisation-1", new Date(Date.UTC(2025, 5, 1))).QUOTES_DONE, 320);
  assert.equal(mapTargets(rows, "organisation-1", new Date(Date.UTC(2025, 6, 1))).QUOTES_DONE, 340);
  assert.equal(mapTargets(rows, "organisation-1", new Date(Date.UTC(2027, 0, 1))).QUOTES_DONE, 340);
  assert.equal(mapTargets(rows, "organisation-2", new Date(Date.UTC(2025, 6, 1))).QUOTES_DONE, 300);
});

test("a later effective target supersedes the selected-and-future target only from its own month", () => {
  const rows = [
    { organisation_id: "organisation-1", metric_code: "CONVERSION_RATE", target_value: 65, effective_from: "2026-07-01", effective_to: null, is_active: true },
    { organisation_id: "organisation-1", metric_code: "CONVERSION_RATE", target_value: 70, effective_from: "2026-10-01", effective_to: null, is_active: true },
  ];
  assert.equal(mapTargets(rows, "organisation-1", new Date(Date.UTC(2026, 8, 1))).CONVERSION_RATE, 65);
  assert.equal(mapTargets(rows, "organisation-1", new Date(Date.UTC(2026, 9, 1))).CONVERSION_RATE, 70);
});

test("target validation rejects invalid numeric values and keeps rate representation as percentage points", async () => {
  const invalid = validForm();
  invalid.set("CONVERSION_RATE", "101");
  assert.deepEqual(await executeTargetSave({ year: 2026, month: 7 }, invalid, dependencies()), { ok: false, message: "Targets must use valid non-negative values." });
  const rate = validForm();
  rate.set("CONVERSION_RATE", "56.9");
  await executeTargetSave({ year: 2026, month: 7 }, rate, dependencies({
    upsertTargets: async (targets) => { assert.equal(targets.CONVERSION_RATE, 56.9); return { error: null }; },
  }));
});
