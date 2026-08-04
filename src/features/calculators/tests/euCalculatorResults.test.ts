import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const results = readFileSync(new URL("../components/EuCalculatorResults.tsx", import.meta.url), "utf8");
const copyableCard = readFileSync(new URL("../../../components/ui/CopyableCard.tsx", import.meta.url), "utf8");
const calculator = readFileSync(new URL("../components/EuCalculator.tsx", import.meta.url), "utf8");

test("Pins Price uses one semantic copy button for card and icon activation", () => {
  assert.match(copyableCard, /<button type="button"/);
  assert.match(copyableCard, /onClick=\{\(event\) => \{ onClick\?\.\(event\); void copy\(\); \}\}/);
  assert.doesNotMatch(copyableCard, /role="button"/);
  assert.match(results, /<CopyableCard[\s\S]*value=\{quoteFormatter\(items, totals\)\}/);
});

test("breakdown presentation uses one combined card per item", () => {
  assert.match(results, /items\.map\(\(line, index\) => \{/);
  assert.match(results, /return <Surface key=\{line\.result\.itemId\} variant="compact"/);
  assert.match(results, /buildAlignedEuBreakdownRows\(line, breakdown\.productionItems\[index\], breakdown\.pinsItems\[index\]\)/);
  assert.match(results, /<AlignedBreakdownCell cell=\{row\.production\} \/>[\s\S]*<AlignedBreakdownCell cell=\{row\.pins\} \/>/);
  assert.match(results, /Production Cost Breakdown/);
  assert.match(results, /Pins Price Breakdown/);
});

test("desktop calculator keeps inputs and results in responsive two columns", () => {
  assert.match(calculator, /lg:grid-cols-\[minmax\(0,1\.35fr\)_minmax\(20rem,1fr\)\]/);
  assert.match(calculator, /<EuCalculatorResults items=\{validQuoteLines\} totals=\{totals\}/);
  assert.match(results, /grid min-w-0 gap-3 sm:grid-cols-2/);
  assert.match(results, /whitespace-nowrap/);
});
