import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { mondayIdentities } from "../../sales-dashboard/domain/memberIdentity.ts";
import { resolveLastActive } from "../data/teamMembers.ts";
import { USER_TABLE_COLUMNS } from "../lib/table.ts";
import { validateUserUpdateInput } from "../lib/updateUser.ts";

test("uses the compact User Access Management table contract", () => {
  assert.deepEqual(USER_TABLE_COLUMNS, ["Full Name", "Email", "Status", "Role", "Joined Date", "Last Active", "Actions"]);
});

test("Last Active prefers tracked Pins Hub activity, then auth sign-in, then a dash", () => {
  assert.equal(resolveLastActive("2026-08-06T10:00:00.000Z", "2026-08-06T09:00:00.000Z"), "2026-08-06T10:00:00.000Z");
  assert.equal(resolveLastActive(null, "2026-08-06T09:00:00.000Z"), "2026-08-06T09:00:00.000Z");
  assert.equal(resolveLastActive(null, null), null);
});

test("Monday selector is sourced from every canonical known identity and supports an unlinked state", () => {
  assert.equal(mondayIdentities().length, 6);
  assert.ok(mondayIdentities().every((person) => person.id && person.displayName));
  assert.equal(new Set(mondayIdentities().map((person) => person.id)).size, mondayIdentities().length);
});

function updateInput(values: Record<string, string>) {
  const formData = new FormData();
  for (const [key, value] of Object.entries(values)) formData.append(key, value);
  return formData;
}

test("accepts a blank profile name being updated to a trimmed valid name with unchanged access", () => {
  assert.deepEqual(validateUserUpdateInput(updateInput({ membership_id: "member-1", full_name: "  Johan  ", organisation_role: "Admin", access_level: "ADMIN", monday_member_id: "none", is_active: "true" })), {
    membershipId: "member-1", fullName: "Johan", role: "admin", accessLevel: "admin", mondayMemberId: null, isActive: true,
  });
});

test("accepts a valid canonical Monday identity and rejects invalid role or access values", () => {
  assert.equal((validateUserUpdateInput(updateInput({ membership_id: "member-1", full_name: "Johan", organisation_role: "admin", access_level: "admin", monday_member_id: "29869326" })) as { mondayMemberId: string }).mondayMemberId, "29869326");
  assert.deepEqual(validateUserUpdateInput(updateInput({ membership_id: "member-1", full_name: "Johan", organisation_role: "invalid", access_level: "admin" })), { error: "Select a valid organisation role." });
  assert.deepEqual(validateUserUpdateInput(updateInput({ membership_id: "member-1", full_name: "Johan", organisation_role: "admin", access_level: "invalid" })), { error: "Select a valid Pins Hub access level." });
});

const dialogPath = new URL("../components/UserEditDialog.tsx", import.meta.url);
const tablePath = new URL("../components/TeamMembersTable.tsx", import.meta.url);
const actionMenuPath = new URL("../../../components/ui/ActionMenu.tsx", import.meta.url);

test("handles each successful edit result once and creates a clean dialog for the next selected user", async () => {
  const dialog = await readFile(dialogPath, "utf8");
  const table = await readFile(tablePath, "utf8");
  assert.match(dialog, /const handledStateRef = useRef\(initialUserAccessActionState\)/);
  assert.match(dialog, /if \(state === handledStateRef\.current\) return/);
  assert.match(dialog, /handledStateRef\.current = state/);
  assert.match(table, /<UserEditDialog key=\{editing\.id\} member=\{editing\}/);
});

test("editing Catherine then Johan remounts the form with the selected member values", async () => {
  const dialog = await readFile(dialogPath, "utf8");
  assert.match(dialog, /defaultValue=\{member\.fullName \?\? ""\}/);
  assert.match(dialog, /defaultValue=\{protectedUser \? "owner" : member\.role\.toLowerCase\(\)\}/);
  assert.match(dialog, /defaultValue=\{member\.mondayMemberId \?\? "none"\}/);
});

test("action menus never submit a surrounding form", async () => {
  const actionMenu = await readFile(actionMenuPath, "utf8");
  assert.match(actionMenu, /DropdownMenu\.Trigger type="button"/);
});
