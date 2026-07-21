import assert from "node:assert/strict";
import test from "node:test";
import { executeManualKpiSave, type ManualKpiSaveDependencies } from "../lib/manualKpiSave.ts";
import { getSalesDashboardQueryPlan } from "../lib/queryPlan.ts";
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
  formData.set("year", "2025");
  formData.set("month", "7");
  formData.set("monthly_profit", "125000.50");
  formData.set("quotes_done", "42");
  return formData;
}

function dependencies(overrides: Partial<ManualKpiSaveDependencies> = {}): ManualKpiSaveDependencies {
  return {
    getAccess: async () => adminAccess,
    upsertCompany: async () => ({ error: null }),
    upsertMember: async () => ({ error: null }),
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

test("manual save validates before access or writes", async () => {
  const formData = validForm();
  formData.set("month", "13");
  let accessCalls = 0;
  const result = await executeManualKpiSave(formData, dependencies({
    getAccess: async () => { accessCalls += 1; return adminAccess; },
  }));
  assert.deepEqual(result, { ok: false, message: "Month must be between 1 and 12." });
  assert.equal(accessCalls, 0);
});

test("manual company save writes and revalidates exactly once", async () => {
  let companyWrites = 0;
  let memberWrites = 0;
  const paths: string[] = [];
  const result = await executeManualKpiSave(validForm(), dependencies({
    upsertCompany: async (input) => { companyWrites += 1; assert.equal(input.monthlyProfit, 125000.5); return { error: null }; },
    upsertMember: async () => { memberWrites += 1; return { error: null }; },
    revalidate: (path) => paths.push(path),
  }));
  assert.deepEqual(result, { ok: true, message: "Monthly KPIs saved." });
  assert.equal(companyWrites, 1);
  assert.equal(memberWrites, 0);
  assert.deepEqual(paths, ["/hub/sales-dashboard"]);
});

test("manual save returns a safe database failure and does not revalidate", async () => {
  let revalidations = 0;
  const result = await executeManualKpiSave(validForm(), dependencies({
    upsertCompany: async () => ({ error: { code: "42501", message: "row-level security policy detail" } }),
    revalidate: () => { revalidations += 1; },
  }));
  assert.deepEqual(result, { ok: false, message: "Database access denied." });
  assert.equal(revalidations, 0);
});
