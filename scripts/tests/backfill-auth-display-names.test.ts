import assert from "node:assert/strict";
import test from "node:test";
import { planAuthDisplayNameBackfill } from "../lib/authDisplayNameBackfill.ts";

test("backfill dry-run plan updates missing or mismatched Auth metadata without writing", () => {
  assert.deepEqual(planAuthDisplayNameBackfill({ id: "user-1", full_name: "  Ada Lovelace  " }, { full_name: "Ada" }), {
    action: "update", userId: "user-1", metadata: { full_name: "Ada Lovelace", display_name: "Ada Lovelace" },
  });
});

test("backfill skips already synchronised and blank profile names", () => {
  assert.deepEqual(planAuthDisplayNameBackfill({ id: "user-1", full_name: "Ada Lovelace" }, { full_name: "Ada Lovelace", display_name: "Ada Lovelace" }), { action: "skip" });
  assert.deepEqual(planAuthDisplayNameBackfill({ id: "user-2", full_name: "   " }), { action: "skip" });
  assert.deepEqual(planAuthDisplayNameBackfill({ id: null, full_name: "Ada Lovelace" }), { action: "skip" });
});
