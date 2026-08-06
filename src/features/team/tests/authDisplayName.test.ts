import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { authDisplayNameMatches, authDisplayNameMetadata, trimFullName } from "../lib/authDisplayName.ts";

test("auth display-name metadata keeps the trimmed canonical profile name in both fields", () => {
  const fullName = trimFullName("  Ada Lovelace  ");
  assert.deepEqual(authDisplayNameMetadata(fullName, { locale: "en" }), { locale: "en", full_name: "Ada Lovelace", display_name: "Ada Lovelace" });
  assert.equal(authDisplayNameMatches({ full_name: "Ada Lovelace", display_name: "Ada Lovelace" }, fullName), true);
});

test("UAM updates the profile first, then Auth metadata by stable user ID and reports partial sync failures", async () => {
  const source = await readFile(new URL("../actions/users.ts", import.meta.url), "utf8");
  const profileWrite = source.indexOf('from("profiles").update({ full_name: fullName }).eq("id", target.user_id)');
  const authWrite = source.indexOf("admin.auth.admin.updateUserById(target.user_id");
  assert.ok(profileWrite >= 0 && authWrite > profileWrite);
  assert.match(source, /admin\.auth\.admin\.getUserById\(target\.user_id\)/);
  assert.match(source, /authDisplayNameMetadata\(fullName, authResult\.user\.user_metadata\)/);
  assert.match(source, /Profile updated, but Auth display-name synchronisation failed/);
  assert.doesNotMatch(source, /updateUserById\([^\n]*email/);
});
