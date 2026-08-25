import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("includes temporary safe /hub request diagnostics at the page boundary", async () => {
  const source = await readFile(new URL("./page.tsx", import.meta.url), "utf8");

  assert.match(source, /TEMPORARY: remove after identifying the repeated \/hub request source/);
  assert.match(source, /await headers\(\)/);
  assert.match(source, /hasNextRouterStateTree: requestHeaders\.has\("next-router-state-tree"\)/);
  assert.match(source, /getClaims: "bypass \(proxy is not registered\)"/);
  assert.doesNotMatch(source, /requestHeaders\.get\("cookie"\)/);
  assert.doesNotMatch(source, /requestHeaders\.get\("authorization"\)/);
});
