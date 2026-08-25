import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("root auth panel reads the request session without forcing a runtime-only connection boundary", async () => {
  const source = await readFile(new URL("./page.tsx", import.meta.url), "utf8");

  assert.match(source, /const supabase = await createClient\(\)/);
  assert.match(source, /supabase\.auth\.getUser\(\)/);
  assert.doesNotMatch(source, /connection\(\)/);
  assert.doesNotMatch(source, /href="\/"/);
});
