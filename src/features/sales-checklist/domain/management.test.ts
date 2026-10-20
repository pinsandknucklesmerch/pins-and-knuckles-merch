import assert from "node:assert/strict";
import test from "node:test";
import { parseManagementInput } from "./management.ts";

const input = {
  duties: [{ id: "10000000-0000-4000-8000-000000000001", name: "Follow up", displayOrder: 0, isActive: true }],
  staff: [{ id: "20000000-0000-4000-8000-000000000001", name: "Fixture", memberId: "30000000-0000-4000-8000-000000000001", displayOrder: 0, isActive: true }],
};

test("management validates assignments and duties without snapshot metadata", () => {
  assert.throws(() => parseManagementInput({ ...input, staff: [{ ...input.staff[0], memberId: null }] }), /organisation user/);
  assert.throws(() => parseManagementInput({ ...input, duties: [{ ...input.duties[0], name: " " }] }), /duty names/);
});
