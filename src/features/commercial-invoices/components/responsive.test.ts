import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("commercial invoice keeps preview scrolling inside its surface", async () => {
  const source = await readFile(new URL("./CommercialInvoiceGenerator.tsx", import.meta.url), "utf8");
  assert.match(source, /max-w-full overflow-x-auto/);
  assert.match(source, /<InvoicePreview invoice=\{calculated\}/);
});
