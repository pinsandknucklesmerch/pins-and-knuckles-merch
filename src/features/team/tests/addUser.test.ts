import assert from "node:assert/strict";
import test from "node:test";
import { emailDisplayName } from "../components/AddUserForm.tsx";
import { canManageOrganisationUsers } from "@/lib/access/pinsHubRoles";

test("email display names normalise common separators until manually edited", () => {
  assert.equal(emailDisplayName("test@email.com"), "Test");
  assert.equal(emailDisplayName("john.smith@email.com"), "John Smith");
  assert.equal(emailDisplayName("mary_jane@email.com"), "Mary Jane");
  assert.equal(emailDisplayName("test-user@email.com"), "Test User");
});

test("only owner or developer can manage organisation users", () => {
  assert.equal(canManageOrganisationUsers("developer", "member"), true);
  assert.equal(canManageOrganisationUsers("admin", "owner"), true);
  assert.equal(canManageOrganisationUsers("admin", "admin"), false);
});
