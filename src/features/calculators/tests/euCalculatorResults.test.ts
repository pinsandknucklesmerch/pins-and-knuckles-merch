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
  assert.match(results, /<BreakdownRow key=\{row\.key\} row=\{row\} \/>/);
  assert.match(results, /Cost line/);
  assert.match(results, /Production Cost/);
  assert.match(results, /Pins Price/);
  assert.match(results, /grid-cols-\[minmax\(0,1fr\)_minmax\(max-content,0\.75fr\)_minmax\(max-content,0\.75fr\)\]/);
  assert.match(results, /max-md:grid-cols-\[minmax\(0,1fr\)_minmax\(max-content,0\.75fr\)\]/);
  assert.match(results, /function BreakdownRow[\s\S]*border-b border-border\/60[\s\S]*grid-cols-\[minmax\(0,1fr\)_minmax\(max-content,0\.75fr\)_minmax\(max-content,0\.75fr\)\]/);
});

test("breakdown cells omit missing values and keep value columns non-wrapping", () => {
  assert.match(results, /row\.production\?\.label \?\? row\.pins\?\.label/);
  assert.match(results, /aria-hidden="true"/);
  assert.match(results, /whitespace-nowrap text-right font-medium tabular-nums/);
  assert.match(results, /row\.key === "unit-cost" \|\| row\.key === "subtotal"/);
});

test("desktop calculator keeps inputs and results in responsive two columns", () => {
  assert.match(calculator, /lg:grid-cols-\[minmax\(0,1\.35fr\)_minmax\(20rem,1fr\)\]/);
  assert.match(calculator, /<EuCalculatorResults items=\{validQuoteLines\} totals=\{totals\}/);
  assert.match(results, /grid min-w-0 gap-3 sm:grid-cols-2/);
  assert.match(results, /whitespace-nowrap/);
});
