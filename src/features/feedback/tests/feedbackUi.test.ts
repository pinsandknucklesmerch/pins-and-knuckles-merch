import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("feedback UI validates comments and diagnostics are removed from the normal dashboard", async () => {
  const [action, snuggle, diagnostics] = await Promise.all([
    readFile("src/features/feedback/actions.ts", "utf8"),
    readFile("src/features/sales-dashboard/components/SnuggleView.tsx", "utf8"),
    readFile("src/app/(hub)/hub/developer/diagnostics/page.tsx", "utf8"),
  ]);
  assert.match(action, /if \(!comment\) return fail\("Comment is required\."\)/);
  assert.doesNotMatch(snuggle, /Admin diagnostics/);
  assert.match(diagnostics, /syncSnuggleDiagnosticIssues/);
  assert.match(diagnostics, /Open and investigating/);
  assert.match(diagnostics, /name="month"/);
});
