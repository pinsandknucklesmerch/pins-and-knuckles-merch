import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("feedback records expose keyboard-accessible actions and semantic headers", async () => {
  const source = await readFile(new URL("./FeedbackInbox.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(source, /<tr[^>]*onClick/);
  assert.match(source, /<button type="button" onClick=\{\(\) => setSelected\(report\)\}/);
  assert.equal((source.match(/scope="col"/g) ?? []).length, 7);
});
