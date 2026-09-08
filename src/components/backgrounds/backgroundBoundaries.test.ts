import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("background layer keeps the disabled state plain and lazy-loads Galaxy when enabled", async () => {
  const source = await readFile(new URL("./BackgroundLayer.tsx", import.meta.url), "utf8");
  assert.match(source, /if \(!enabled\)/);
  assert.match(source, /void import\("\.\/Galaxy"\)/);
  assert.match(source, /enabled && Galaxy/);
  assert.match(source, /fixed inset-0 bg-black/);
  assert.doesNotMatch(source, /from ["']ogl["']/);
});
