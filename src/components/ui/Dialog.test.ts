import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("shared Dialog provides modal semantics, focus handling, and Escape/backdrop close", async () => {
  const source = await readFile(new URL("./Dialog.tsx", import.meta.url), "utf8");
  assert.match(source, /role="dialog"/);
  assert.match(source, /aria-modal="true"/);
  assert.match(source, /aria-labelledby=\{titleId\}/);
  assert.match(source, /event\.key === "Escape"/);
  assert.match(source, /previousFocusRef\.current\?\.focus\(\)/);
  assert.match(source, /event\.target === event\.currentTarget/);
  assert.match(source, /dialog\.querySelector/);
  assert.match(source, /aria-label=\{closeLabel\}/);
  assert.match(source, /min-h-9 min-w-9/);
  assert.match(source, /dialog\.showModal\(\)/);
});
