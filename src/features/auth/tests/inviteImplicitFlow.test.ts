import assert from "node:assert/strict";
import test from "node:test";

import {
  completeInviteFragment,
  parseInviteFragment,
  safeUrlWithoutFragment,
  shouldProcessInviteCallback,
} from "../lib/inviteImplicitFlow.ts";

test("leaves ordinary URLs and hashes untouched", () => {
  assert.deepEqual(parseInviteFragment(""), { kind: "not-invite" });
  assert.deepEqual(parseInviteFragment("#"), { kind: "not-invite" });
  assert.deepEqual(parseInviteFragment("#section-2"), { kind: "not-invite" });
  assert.deepEqual(parseInviteFragment("#type=recovery&access_token=access"), { kind: "not-invite" });
  assert.equal(safeUrlWithoutFragment("/", "?tab=home"), "/?tab=home");
  assert.equal(shouldProcessInviteCallback("", ""), false);
  assert.equal(shouldProcessInviteCallback("#", ""), false);
  assert.equal(shouldProcessInviteCallback("#section-2", ""), false);
  assert.equal(shouldProcessInviteCallback("", "?tab=home"), false);
});

test("recognizes complete invites, incomplete callbacks, and explicit errors", () => {
  assert.deepEqual(parseInviteFragment("#type=invite&access_token=access&refresh_token=refresh"), {
    kind: "invite",
    accessToken: "access",
    refreshToken: "refresh",
  });
  assert.deepEqual(parseInviteFragment("#type=invite&access_token=access"), {
    kind: "invalid-invite",
  });
  assert.deepEqual(parseInviteFragment("#error=access_denied&error_description=private"), {
    kind: "callback-error",
  });
});

test("sets an invite session, clears tokens from history, then redirects to password setup", async () => {
  const redirects: string[] = [];
  let cleared = 0;
  const result = await completeInviteFragment(
    { kind: "invite", accessToken: "access", refreshToken: "refresh" },
    {
      setSession: async (tokens) => {
        assert.deepEqual(tokens, { access_token: "access", refresh_token: "refresh" });
        return { error: null };
      },
      clearFragment: () => { cleared += 1; },
      replace: (path) => redirects.push(path),
    },
  );
  assert.equal(result, "redirected");
  assert.equal(cleared, 1);
  assert.deepEqual(redirects, ["/auth/update-password?mode=invite"]);
});

test("clears failed or incomplete invite fragments and leaves ordinary visits alone", async () => {
  const redirects: string[] = [];
  let cleared = 0;
  const dependencies = {
    setSession: async () => ({ error: new Error("safe failure") }),
    clearFragment: () => { cleared += 1; },
    replace: (path: string) => redirects.push(path),
  };
  assert.equal(await completeInviteFragment({ kind: "invalid-invite" }, dependencies), "error");
  assert.equal(await completeInviteFragment({ kind: "not-invite" }, dependencies), "unchanged");
  assert.equal(await completeInviteFragment({ kind: "invite", accessToken: "a", refreshToken: "r" }, dependencies), "error");
  assert.equal(cleared, 2);
  assert.deepEqual(redirects, ["/auth/error", "/auth/error"]);
});
