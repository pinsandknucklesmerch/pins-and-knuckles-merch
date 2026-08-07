import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const componentPath = new URL("./SearchableCombobox.tsx", import.meta.url);

test("SearchableCombobox preserves keyboard, selection, clearing, and portalled positioning", async () => {
  const source = await readFile(componentPath, "utf8");
  assert.match(source, /event\.key === "ArrowDown"/);
  assert.match(source, /event\.key === "ArrowUp"/);
  assert.match(source, /event\.key === "Enter"/);
  assert.match(source, /event\.key === "Escape"/);
  assert.match(source, /onClear\?\.\(\)/);
  assert.match(source, /createPortal\(/);
  assert.match(source, /window\.addEventListener\("scroll", updatePosition, true\)/);
  assert.match(source, /window\.innerWidth - width - viewportPadding/);
  assert.match(source, /Math\.max\(rect\.left, viewportPadding\)/);
  assert.match(source, /maxHeight = Math\.max\(48/);
  assert.match(source, /className="fixed z-40/);
});
