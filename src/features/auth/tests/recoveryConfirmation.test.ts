import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

import {
  getSafeAuthNextPath,
  parseRecoveryConfirmationInput,
  verifyRecoveryConfirmation,
} from "../lib/recoveryConfirmation.ts";

test("recovery confirmation page does not verify a token while rendering", async () => {
  const page = await readFile(new URL("../../../app/(auth)/auth/recovery-confirm/page.tsx", import.meta.url), "utf8");

  assert.match(page, /method="post"/);
  assert.doesNotMatch(page, /verifyOtp/);
  assert.doesNotMatch(page, /createClient/);
});

test("explicit recovery confirmation verifies exactly once and preserves a safe next path", async () => {
  const input = parseRecoveryConfirmationInput({
    tokenHash: "a".repeat(43),
    type: "recovery",
    next: "/auth/update-password",
  });
  let calls = 0;

  assert.ok(input);
  assert.equal(await verifyRecoveryConfirmation(input, async (params) => {
    calls += 1;
    assert.deepEqual(params, { token_hash: "a".repeat(43), type: "recovery" });
    return { error: null };
  }), "verified");
  assert.equal(calls, 1);
  assert.equal(input.next, "/auth/update-password");
});

test("expired recovery tokens fail and malformed recovery requests are rejected", async () => {
  const input = parseRecoveryConfirmationInput({
    tokenHash: "a".repeat(43),
    type: "recovery",
    next: null,
  });

  assert.ok(input);
  assert.equal(await verifyRecoveryConfirmation(input, async () => ({ error: new Error("expired") })), "error");
  assert.equal(parseRecoveryConfirmationInput({ tokenHash: null, type: "recovery", next: null }), null);
  assert.equal(parseRecoveryConfirmationInput({ tokenHash: "a".repeat(43), type: "invite", next: null }), null);
});

test("unsafe next paths fall back to the password update page", () => {
  assert.equal(getSafeAuthNextPath("https://attacker.example"), "/auth/update-password");
  assert.equal(getSafeAuthNextPath("//attacker.example"), "/auth/update-password");
  assert.equal(getSafeAuthNextPath("/auth/update-password"), "/auth/update-password");
});

test("the existing PKCE confirmation route still exchanges a code", async () => {
  const route = await readFile(new URL("../../../app/(auth)/auth/confirm/route.ts", import.meta.url), "utf8");

  assert.match(route, /exchangeCodeForSession\(code\)/);
  assert.match(route, /getSafeAuthNextPath/);
});
