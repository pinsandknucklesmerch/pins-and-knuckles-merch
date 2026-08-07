import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

import { validateInviteInput } from "../lib/invite.ts";

const componentPath = new URL("../components/InviteMemberForm.tsx", import.meta.url);
const actionPath = new URL("../actions/inviteMember.ts", import.meta.url);
const pagePath = new URL("../../../app/(hub)/hub/team/page.tsx", import.meta.url);

async function componentSource() {
  return readFile(componentPath, "utf8");
}

test("one explicit submit has one native action path and blocks repeated clicks while pending", async () => {
  const source = await componentSource();
  assert.match(source, /<form ref=\{formRef\} action=\{formAction\} onSubmit=\{handleSubmit\}/);
  assert.match(source, /<button disabled=\{pending\} type="submit"/);
  assert.match(source, /\{pending \? "Sending…" : "Send invite"\}/);
  assert.equal((source.match(/action=\{formAction\}/g) ?? []).length, 1);
  assert.doesNotMatch(source, /formAction\s*\(/);
  assert.match(source, /if \(!pending && !submittedRef\.current\)/);
  assert.match(source, /event\.preventDefault\(\)/);
  assert.match(source, /onChange=\{unlockForChangedInvite\}/);
});

test("success only resets fields and never submits again", async () => {
  const source = await componentSource();
  assert.match(source, /formRef\.current\?\.reset\(\)/);
  assert.match(source, /state\.status !== "success"/);
  assert.doesNotMatch(source, /router\.refresh|requestSubmit|\.submit\(/);
  assert.match(source, /feedback\.success\(state\.message\)/);
  assert.doesNotMatch(source, /\{state\.message \? <p role="status"/);
});

test("empty FormData is rejected before any Auth or provisioning work", async () => {
  const source = await readFile(actionPath, "utf8");
  const validation = source.indexOf("const input = validateInviteInput(formData);");
  const authClient = source.indexOf("const supabase = await createClient();");
  assert.ok(validation >= 0 && validation < authClient);
  assert.equal(validateInviteInput(new FormData()), null);
});

test("only organisation owners receive the Add User link, without an empty invite surface for other roles", async () => {
  const page = await readFile(pagePath, "utf8");
  assert.match(page, /canManageOrganisationUsers\(access\.access\?\.access_level, access\.membership\.role\) \? <Link href="\/hub\/team\/add"/);
  assert.equal((page.match(/InviteMemberForm/g) ?? []).length, 0);
  assert.doesNotMatch(page, /<InviteMemberForm \/>/);
});

test("invite action requires the owner role even when the caller has Pins Hub admin access", async () => {
  const source = await readFile(actionPath, "utf8");
  assert.match(source, /canInviteMembers\(\{ authenticated: current\.authenticated, accessLevel: current\.access\?\.access_level, membershipRole: membership\?\.role/);
  assert.match(source, /You do not have permission to manage User Access Management\./);
});

test("new invites write both trimmed display-name metadata fields", async () => {
  const source = await readFile(actionPath, "utf8");
  assert.match(source, /data: authDisplayNameMetadata\(input\.fullName\)/);
  assert.match(source, /inviteUserByEmail/);
  assert.deepEqual(validateInviteInput(new FormData()), null);
});

  test("success revalidates the User Access Management route without client navigation", async () => {
  const component = await componentSource();
  const action = await readFile(actionPath, "utf8");
  assert.doesNotMatch(component, /router\.refresh|router\.push|window\.location/);
  assert.match(action, /revalidatePath\("\/hub\/team"\)/);
});
