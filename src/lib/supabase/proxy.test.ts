import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const proxy = readFileSync(new URL("../../../proxy.ts", import.meta.url), "utf8");
const sessionProxy = readFileSync(new URL("./proxy.ts", import.meta.url), "utf8");

test("does not run session handling for Next internal requests", () => {
  assert.match(proxy, /_next\//);
  assert.doesNotMatch(proxy, /_next\/static\|_next\/image/);
});

test("skips Auth claims calls for App Router prefetches", () => {
  assert.match(sessionProxy, /function isNavigationPrefetch/);
  assert.match(sessionProxy, /next-router-prefetch/);
  assert.match(sessionProxy, /if \(isPrefetch\) \{\s*return supabaseResponse;\s*\}/);
});
