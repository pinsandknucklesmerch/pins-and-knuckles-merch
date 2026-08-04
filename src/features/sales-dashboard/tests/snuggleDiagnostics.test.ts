import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { getSnuggleFailureCategory, SnuggleServiceError } from "../server/snuggleDiagnostics.ts";

test("Snuggle production configuration is server-only and uses the expected board variable", async () => {
  const source = await readFile("src/features/sales-dashboard/server/snuggleProfit.ts", "utf8");
  const envExample = await readFile(".env.example", "utf8");
  assert.match(source, /process\.env\.MONDAY_API_TOKEN/);
  assert.match(source, /process\.env\.MONDAY_SNUGGLE_BOARD_ID/);
  assert.doesNotMatch(source, /NEXT_PUBLIC_MONDAY/);
  assert.match(envExample, /MONDAY_SNUGGLE_BOARD_ID=18393924380/);
  assert.doesNotMatch(envExample, /MONDAY_API_TOKEN=sk[-_]/);
});

test("Snuggle diagnostics expose only safe failure categories", () => {
  assert.equal(getSnuggleFailureCategory(new SnuggleServiceError("missing configuration")), "missing configuration");
  assert.equal(getSnuggleFailureCategory(new SnuggleServiceError("authentication failure")), "authentication failure");
  assert.equal(getSnuggleFailureCategory(new SnuggleServiceError("board/workspace validation failure")), "board/workspace validation failure");
  assert.equal(getSnuggleFailureCategory(new SnuggleServiceError("GraphQL response failure")), "GraphQL response failure");
  assert.equal(getSnuggleFailureCategory(new SnuggleServiceError("invalid FormulaValue response")), "invalid FormulaValue response");
  assert.equal(getSnuggleFailureCategory(new Error("token=secret")), "GraphQL response failure");
});
