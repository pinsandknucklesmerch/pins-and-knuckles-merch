import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("diagnostic records expose keyboard-accessible actions and semantic headers", async () => {
  const source = await readFile(new URL("./DiagnosticsInbox.tsx", import.meta.url), "utf8");
  assert.doesNotMatch(source, /<tr[^>]*onClick/);
  assert.match(source, /<button type="button" onClick=\{\(\) => setSelected\(issue\)\}/);
  assert.equal((source.match(/scope="col"/g) ?? []).length, 7);
});
