import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import ts from "typescript";

import { validateInviteInput } from "../lib/invite.ts";

const actionPath = new URL("../actions/inviteMember.ts", import.meta.url);
const pagePath = new URL("../../../app/(hub)/hub/team/page.tsx", import.meta.url);

test("empty FormData is rejected before any Auth or provisioning work", async () => {
  const source = await readFile(actionPath, "utf8");
  const file = ts.createSourceFile("inviteMember.ts", source, ts.ScriptTarget.Latest, true);
  const action = file.statements.find((statement) => ts.isFunctionDeclaration(statement) && statement.name?.text === "inviteMember");
  assert.ok(action && ts.isFunctionDeclaration(action) && action.body);
  const statements = action.body.statements;
  const validationIndex = statements.findIndex((statement) => statement.getText(file).startsWith("const input = validateInviteInput(formData)"));
  assert.ok(validationIndex >= 0);
  const rejection = statements[validationIndex + 1];
  assert.ok(ts.isIfStatement(rejection));
  assert.equal(rejection.expression.getText(file), "!input");
  assert.ok(ts.isReturnStatement(rejection.thenStatement));
  assert.match(rejection.thenStatement.getText(file), /status: "error"/);

  const boundaryCalls = new Map<string, ts.CallExpression[]>();
  const boundaries = ["createClient", "createAdminClient", "getCurrentPinsHubAccess", "provisionAccess"];
  function visit(node: ts.Node) {
    if (ts.isCallExpression(node)) {
      const name = node.expression.getText(file);
      if (boundaries.includes(name)) boundaryCalls.set(name, [...(boundaryCalls.get(name) ?? []), node]);
    }
    ts.forEachChild(node, visit);
  }
  visit(action.body);
  for (const name of boundaries) {
    const calls = boundaryCalls.get(name);
    assert.ok(calls?.length, name + " must remain covered by the validation boundary");
    for (const call of calls) assert.ok(rejection.end < call.getStart(file), name + " must follow input rejection");
  }
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
