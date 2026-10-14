import assert from "node:assert/strict";
import test from "node:test";
import { parseManagementInput } from "./management.ts";

const input = {
  revision: null,
  effectiveFrom: "2026-10-19T09:00:00+02:00",
  duties: [{ id: "10000000-0000-4000-8000-000000000001", name: "Follow up", displayOrder: 0, isActive: true }],
  staff: [{ id: "20000000-0000-4000-8000-000000000001", name: "Fixture", memberId: "30000000-0000-4000-8000-000000000001", displayOrder: 0, isActive: true }],
};

test("management sends the displayed effective instant with its existing revision", () => {
  const parsed = parseManagementInput(input);
  assert.equal(parsed.effectiveFrom, "2026-10-19T07:00:00.000Z");
  assert.equal(parsed.revision, null);
});

test("missing or invalid effective-week metadata requires a configuration refresh", () => {
  assert.throws(() => parseManagementInput({ ...input, effectiveFrom: undefined }), /Refresh configuration/);
  assert.throws(() => parseManagementInput({ ...input, effectiveFrom: "invalid" }), /Refresh configuration/);
});

test("effective-week metadata does not relax assignment or duty validation", () => {
  assert.throws(() => parseManagementInput({ ...input, staff: [{ ...input.staff[0], memberId: null }] }), /organisation user/);
  assert.throws(() => parseManagementInput({ ...input, duties: [{ ...input.duties[0], name: " " }] }), /duty names/);
});
