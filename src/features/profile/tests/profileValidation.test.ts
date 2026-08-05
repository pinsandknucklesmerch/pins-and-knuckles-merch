import assert from "node:assert/strict";
import test from "node:test";
import { PROFILE_DISPLAY_NAME_MAX_LENGTH, validateDisplayName } from "../lib/profileValidation.ts";

test("display-name validation trims accepted values", () => {
  assert.deepEqual(validateDisplayName("  Alex Smith  "), { ok: true, value: "Alex Smith" });
});

test("display-name validation rejects blank and overlong values", () => {
  assert.deepEqual(validateDisplayName("   "), { ok: false, error: "Enter a display name." });
  assert.equal(validateDisplayName("a".repeat(PROFILE_DISPLAY_NAME_MAX_LENGTH + 1)).ok, false);
});
