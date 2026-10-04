import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { validateInviteInput } from "../lib/invite.ts";

const actionPath = new URL("../actions/inviteMember.ts", import.meta.url);
const pagePath = new URL("../../../app/(hub)/hub/team/page.tsx", import.meta.url);

test("empty FormData is rejected before any Auth or provisioning work", async () => {
  const source = await readFile(actionPath, "utf8");
  const validationIndex = source.indexOf("const input = validateInviteInput(formData)");
  const adminIndex = source.indexOf("createAdminClient");

  assert.ok(validationIndex >= 0);
  assert.ok(adminIndex >= 0);
  assert.ok(validationIndex < adminIndex);
  assert.equal(validateInviteInput(new FormData()), null);
});

test("team route keeps the active Add User entry point behind user-management access", async () => {
  const page = await readFile(pagePath, "utf8");

  assert.match(page, /canManageOrganisationUsers\(access\.access\?\.access_level, access\.membership\.role\)/);
  assert.match(page, /href="\/hub\/team\/add"/);
});

test("invite action requires owner role even when the caller has Pins Hub admin access", async () => {
  const source = await readFile(actionPath, "utf8");

  assert.match(source, /canInviteMembers\(\{ authenticated: current\.authenticated, accessLevel: current\.access\?\.access_level, membershipRole: membership\?\.role/);
  assert.match(source, /You do not have permission to manage User Access Management\./);
});

test("new invites write both trimmed display-name metadata fields", async () => {
  const source = await readFile(actionPath, "utf8");

  assert.match(source, /data: authDisplayNameMetadata\(input\.fullName\)/);
  assert.match(source, /inviteUserByEmail/);
});

test("successful invitations revalidate User Access Management", async () => {
  const action = await readFile(actionPath, "utf8");

  assert.match(action, /revalidatePath\("\/hub\/team"\)/);
});
