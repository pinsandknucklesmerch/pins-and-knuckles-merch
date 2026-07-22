import assert from "node:assert/strict";
import test from "node:test";

import { inviteFailureState, resolveSiteUrl, validateInviteInput } from "../lib/invite.ts";
import { provisionPinsHubAccess } from "../lib/provisionAccess.ts";

function input(values: Record<string, string>) {
  const formData = new FormData();
  for (const [key, value] of Object.entries(values)) formData.set(key, value);
  return formData;
}

test("resolves only safe configured and production invite origins", () => {
  assert.equal(resolveSiteUrl({ NEXT_PUBLIC_SITE_URL: "https://hub.example.com/path", NODE_ENV: "production" }), "https://hub.example.com");
  assert.equal(resolveSiteUrl({ VERCEL_PROJECT_PRODUCTION_URL: "hub.example.com", NODE_ENV: "production" }), "https://hub.example.com");
  assert.equal(resolveSiteUrl({ NEXT_PUBLIC_SITE_URL: "http://hub.example.com", NODE_ENV: "production" }), null);
});

test("uses the local fallback only in development", () => {
  assert.equal(resolveSiteUrl({ NODE_ENV: "development" }), "http://localhost:3000");
  assert.equal(resolveSiteUrl({ NODE_ENV: "production" }), null);
});

test("normalizes valid invite fields and rejects invalid email or enums", () => {
  assert.deepEqual(validateInviteInput(input({ email: "  MEMBER@EXAMPLE.COM ", full_name: "  Ada   Lovelace ", organisation_role: "admin", access_level: "admin" })), {
    email: "member@example.com", fullName: "Ada Lovelace", role: "admin", accessLevel: "admin",
  });
  assert.equal(validateInviteInput(input({ email: "not-email", full_name: "Ada", organisation_role: "admin", access_level: "admin" })), null);
  assert.equal(validateInviteInput(input({ email: "a@example.com", full_name: "Ada", organisation_role: "invalid", access_level: "admin" })), null);
  assert.equal(validateInviteInput(input({ email: "a@example.com", full_name: "Ada", organisation_role: "admin", access_level: "invalid" })), null);
});

test("maps email rate limits and hides raw provider failures", () => {
  assert.deepEqual(inviteFailureState({ code: "over_email_send_rate_limit", message: "provider detail" }), { status: "rate-limit", message: "Email limit reached. Try again later." });
  assert.deepEqual(inviteFailureState({ message: "private Supabase failure" }), { status: "error", message: "Invitation could not be sent." });
});

function mockAdmin(options: { profileError?: unknown; membershipError?: unknown; lookup?: { id: string } | null; lookupError?: unknown; accessError?: unknown } = {}) {
  const writes: Array<{ table: string; values: Record<string, unknown> }> = [];
  const lookup = {
    eq: () => lookup,
    maybeSingle: async () => ({ data: options.lookup ?? { id: "membership-1" }, error: options.lookupError ?? null }),
  };
  const memberships = {
    upsert: async (values: Record<string, unknown>) => {
      writes.push({ table: "organisation_members", values });
      return { error: options.membershipError ?? null };
    },
    select: () => lookup,
  };
  const client = {
    from: (table: string) => {
      if (table === "profiles") return { upsert: async (values: Record<string, unknown>) => { writes.push({ table, values }); return { error: options.profileError ?? null }; } };
      if (table === "organisation_members") return memberships;
      return { upsert: async (values: Record<string, unknown>) => { writes.push({ table, values }); return { error: options.accessError ?? null }; } };
    },
  };
  return { client, writes };
}

const provisionInput = { userId: "user-1", email: "member@example.com", fullName: "Member Name", role: "admin", accessLevel: "admin", organisationId: "org-1" };

test("new invites provision profile, membership, and Pins Hub access without waiting for the auth trigger", async () => {
  const { client, writes } = mockAdmin();
  assert.deepEqual(await provisionPinsHubAccess(client as never, provisionInput), { ok: true });
  assert.deepEqual(writes, [
    { table: "profiles", values: { id: "user-1", email: "member@example.com", full_name: "Member Name" } },
    { table: "organisation_members", values: { organisation_id: "org-1", user_id: "user-1", role: "admin" } },
    { table: "app_access", values: { organisation_member_id: "membership-1", app_key: "pins_hub", access_level: "admin" } },
  ]);
});

test("membership conflicts still resolve an ID and repeated provisioning remains idempotent", async () => {
  const { client, writes } = mockAdmin();
  await provisionPinsHubAccess(client as never, provisionInput);
  await provisionPinsHubAccess(client as never, provisionInput);
  assert.equal(writes.filter(({ table }) => table === "organisation_members").length, 2);
  assert.equal(writes.filter(({ table }) => table === "app_access").length, 2);
});

test("provisioning failures are returned by step without raw Supabase details", async () => {
  const { client } = mockAdmin({ accessError: { code: "23505", message: "private database detail" } });
  assert.deepEqual(await provisionPinsHubAccess(client as never, provisionInput), { ok: false, step: "app_access", error: { code: "23505", message: "private database detail" } });
});

test("a profile write failure stops privileged provisioning before membership or access writes", async () => {
  const { client, writes } = mockAdmin({ profileError: { code: "42501", message: "private permission detail" } });
  const result = await provisionPinsHubAccess(client as never, provisionInput);
  assert.equal(result.ok, false);
  assert.deepEqual(writes.map(({ table }) => table), ["profiles"]);
});
