import assert from "node:assert/strict";
import test from "node:test";
import { MondayClient, assertReadOnlyQuery, dateCoverage, normalizeBoard, normalizePeople, normalizeStatus, parseMondayDate, redactToken, sampleItem } from "../lib/monday/salesHistoryAudit.ts";

test("normalizes board, status, people, dates, and coverage deterministically", () => {
  assert.deepEqual(normalizeBoard({ id: "1", name: "Sales", state: "active", groups: [{ id: "g", title: "Inbox" }], columns: [{ id: "status", title: "Stage", type: "status" }], workspace: { id: "2", name: "Ops" } }).columns, [{ id: "status", title: "Stage", type: "status", settings: null }]);
  assert.equal(normalizeStatus(" Converted  "), "converted"); assert.deepEqual(normalizePeople('{"personsAndTeams":[{"id":12,"kind":"person"},{"id":99,"kind":"team"}]}'), [{ id: "12", name: "" }]); assert.equal(parseMondayDate("2024-02-03"), "2024-02-03");
  assert.deepEqual(dateCoverage([{ id: "1", name: "a", created_at: "2024-03-01" }, { id: "2", name: "b", created_at: null }]), { earliestUsableItemDate: "2024-03-01", latestUsableItemDate: "2024-03-01", datedItemCount: 1, undatedItemCount: 1 }); assert.deepEqual(sampleItem({ id: "1", name: "x" }), { id: "1", name: "x", createdAt: null, updatedAt: null, group: null, columnValues: [] });
});
test("rejects mutations and redacts tokens", () => { assert.throws(() => assertReadOnlyQuery("mutation { create_item }")); assert.doesNotThrow(() => assertReadOnlyQuery("query { boards { id } }")); assert.equal(redactToken("secret"), "[REDACTED]"); });
test("handles GraphQL errors and rate limits without leaking a token", async () => {
  const graphql = new MondayClient("secret", async () => new Response(JSON.stringify({ errors: [{ message: "bad query" }] }), { status: 200, headers: { "content-type": "application/json" } })); await assert.rejects(graphql.query("query { boards { id } }"), /bad query/);
  const limited = new MondayClient("secret", async () => new Response("{}", { status: 429, headers: { "retry-after": "3" } })); await assert.rejects(limited.query("query { boards { id } }"), /rate limit.*3/i);
});
test("paginates board items without loading an entire board at once", async () => {
  const seen: string[] = []; const client = new MondayClient("secret", async (_url, init) => { const body = JSON.parse(String(init?.body)); seen.push(body.query); const page = body.variables.cursor ? { data: { next_items_page: { cursor: null, items: [{ id: "2", name: "second" }] } } } : { data: { boards: [{ items_page: { cursor: "next", items: [{ id: "1", name: "first" }] } }] } }; return new Response(JSON.stringify(page), { headers: { "content-type": "application/json" } }); }); const result = await client.collectItems("9", 200); assert.equal(result.items.length, 2); assert.equal(seen.length, 2); assert.match(seen[0], /items_page\(limit/); assert.match(seen[1], /next_items_page/);
});
