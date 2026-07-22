import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

import { validateInviteInput } from "../lib/invite.ts";

const componentPath = new URL("../components/InviteMemberForm.tsx", import.meta.url);
const actionPath = new URL("../actions/inviteMember.ts", import.meta.url);

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
  assert.match(source, /\{state\.message \? <p role="status"/);
});

test("empty FormData is rejected before any Auth or provisioning work", async () => {
  const source = await readFile(actionPath, "utf8");
  const validation = source.indexOf("const input = validateInviteInput(formData);");
  const authClient = source.indexOf("const supabase = await createClient();");
  assert.ok(validation >= 0 && validation < authClient);
  assert.equal(validateInviteInput(new FormData()), null);
});

test("success revalidates the Team route without client navigation", async () => {
  const component = await componentSource();
  const action = await readFile(actionPath, "utf8");
  assert.doesNotMatch(component, /router\.refresh|router\.push|window\.location/);
  assert.match(action, /revalidatePath\("\/hub\/team"\)/);
});
