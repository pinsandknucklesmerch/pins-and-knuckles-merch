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

test("recovery redirects reject backslashes, control characters, and external destinations", () => {
  const unsafePaths = [
    null, "", "https://outside.example", "//outside.example", "///outside.example",
    "/\\outside.example", "/\\\\outside.example", "/\\user@outside.example",
    "/\t/outside.example", "/\n/outside.example", "/\r/outside.example",
    "/\u0000/outside.example", "/auth/\u007fupdate-password", "javascript:alert(1)",
  ];
  for (const next of unsafePaths) {
    const path = getSafeAuthNextPath(next);
    assert.equal(path, "/auth/update-password", JSON.stringify(next));
    assert.equal(new URL(path, "https://hub.example").origin, "https://hub.example");
    assert.equal(parseRecoveryConfirmationInput({
      tokenHash: "a".repeat(43), type: "recovery", next,
    })?.next, "/auth/update-password");
  }
});

test("legitimate local auth and Hub paths retain their query strings and fragments", () => {
  for (const next of [
    "/auth/update-password",
    "/auth/update-password?mode=invite#password",
    "/hub",
    "/hub/reference?return=%2Fhub&label=two%20words#details",
  ]) {
    assert.equal(getSafeAuthNextPath(next), next);
    assert.equal(new URL(getSafeAuthNextPath(next), "https://hub.example").origin, "https://hub.example");
  }
});

test("the existing PKCE confirmation route still exchanges a code", async () => {
  const route = await readFile(new URL("../../../app/(auth)/auth/confirm/route.ts", import.meta.url), "utf8");

  assert.match(route, /exchangeCodeForSession\(code\)/);
  assert.match(route, /getSafeAuthNextPath/);
});
