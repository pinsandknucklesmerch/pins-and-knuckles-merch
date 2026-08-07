import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("background animation remains disabled without a preference and lazy-loads Galaxy", async () => {
  const source = await readFile(new URL("./BackgroundLayer.tsx", import.meta.url), "utf8");
  assert.match(source, /if \(!enabled\)/);
  assert.match(source, /void import\("\.\/Galaxy"\)/);
  assert.match(source, /enabled && Galaxy/);
  assert.doesNotMatch(source, /from ["']ogl["']/);
});
