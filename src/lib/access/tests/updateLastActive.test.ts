import assert from "node:assert/strict";
import test from "node:test";
import { ACTIVITY_THROTTLE_MS, recordLastActive, shouldUpdateLastActive } from "../updateLastActive.ts";

const now = new Date("2026-08-06T12:00:00.000Z");

function activityClient({ userId = "user-1", lastActiveAt = null, readError = null, writeError = null }: { userId?: string | null; lastActiveAt?: string | null; readError?: unknown; writeError?: unknown } = {}) {
  const writes: Array<{ values: Record<string, unknown>; filters: Array<[string, string]>; condition: string | null }> = [];
  const filters: Array<[string, string]> = [];
  let condition: string | null = null;
  return {
    writes,
    client: {
      auth: { getUser: async () => ({ data: { user: userId ? { id: userId } : null } }) },
      from: () => ({
        select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: lastActiveAt === undefined ? null : { last_active_at: lastActiveAt }, error: readError }) }) }),
        update: (values: Record<string, unknown>) => ({
          eq: (column: string, value: string) => {
            filters.push([column, value]);
            return {
              or: async (value: string) => {
                condition = value;
                writes.push({ values, filters: [...filters], condition });
                return { error: writeError };
              },
            };
          },
        }),
      }),
    },
  };
}

test("null activity records the authenticated user's current server time", async () => {
  const { client, writes } = activityClient();
  await recordLastActive(client as never, now);
  assert.deepEqual(writes, [{ values: { last_active_at: now.toISOString() }, filters: [["id", "user-1"]], condition: "last_active_at.is.null,last_active_at.lt.2026-08-06T11:45:00.000Z" }]);
});

test("activity at or beyond the 15-minute window records again", async () => {
  const { client, writes } = activityClient({ lastActiveAt: new Date(now.getTime() - ACTIVITY_THROTTLE_MS).toISOString() });
  await recordLastActive(client as never, now);
  assert.equal(writes.length, 1);
});

test("recent activity does not record again", async () => {
  const { client, writes } = activityClient({ lastActiveAt: new Date(now.getTime() - ACTIVITY_THROTTLE_MS + 1).toISOString() });
  await recordLastActive(client as never, now);
  assert.equal(writes.length, 0);
  assert.equal(shouldUpdateLastActive(new Date(now.getTime() - ACTIVITY_THROTTLE_MS + 1).toISOString(), now), false);
});

test("missing authenticated users produce no activity update", async () => {
  const { client, writes } = activityClient({ userId: null });
  await recordLastActive(client as never, now);
  assert.equal(writes.length, 0);
});

test("tracking errors are swallowed so protected Hub rendering can continue", async () => {
  const { client, writes } = activityClient({ writeError: new Error("unavailable") });
  await assert.doesNotReject(recordLastActive(client as never, now));
  assert.equal(writes.length, 1);
});

test("trusted access context skips the duplicate auth and profile reads", async () => {
  let authReads = 0;
  const writes: unknown[] = [];
  const client = {
    auth: { getUser: async () => { authReads += 1; throw new Error("duplicate auth read"); } },
    from: () => ({
      select: () => { throw new Error("duplicate profile read"); },
      update: (values: Record<string, unknown>) => ({
        eq: () => ({ or: async () => { writes.push(values); return { error: null }; } }),
      }),
    }),
  };
  await recordLastActive(client as never, now, { userId: "user-1", lastActiveAt: null });
  assert.equal(authReads, 0);
  assert.deepEqual(writes, [{ last_active_at: now.toISOString() }]);
});
