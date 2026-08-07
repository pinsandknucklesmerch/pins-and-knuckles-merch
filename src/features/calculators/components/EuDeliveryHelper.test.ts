import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("delivery copy is single-flight and uses the shared copy path", async () => {
  const source = await readFile(new URL("./EuDeliveryHelper.tsx", import.meta.url), "utf8");
  assert.match(source, /if \(!delivery\.ok \|\| copying\) return/);
  assert.match(source, /await copyText\(formatEuDeliveryCopy\(delivery\)\)/);
  assert.equal((source.match(/copyText\(/g) ?? []).length, 1);
});
