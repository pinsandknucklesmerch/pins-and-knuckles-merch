import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { parseEpccProfitEmail, EPCC_PROFIT_SUBJECT } from "../lib/epccProfitEmail.ts";
import { parseEpccProfitImportArgs } from "../import-epcc-profit-email.ts";

const fixturePath = "docs/imports/epcc-profit-email/fixtures/Pins Knuckles Profits V2 ALL SALES.eml";

async function fixture() {
  const eml = await readFile(fixturePath, "utf8");
  return eml.replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, (address) => /netsuite\.com$/i.test(address) ? address : "redacted@example.test");
}

test("parses item-level EPCC rows and excludes sales-rep summary rows", async () => {
  const report = parseEpccProfitEmail(await fixture());
  assert.equal(report.subject, EPCC_PROFIT_SUBJECT);
  assert.equal(report.reportPeriod.year, 2026);
  assert.equal(report.reportPeriod.month, 7);
  assert.equal(report.parsedRowCount, 319);
  assert.equal(report.monthlyProfit, 91571.84);
  assert.equal(report.numericErrors.length, 0);
  assert.ok(report.transactions.some((row) => row.transactionType === "Credit Memo" && row.total < 0 && row.profitTotal === null));
  assert.equal(report.transactions.filter((row) => row.num === "Inv69198").length, 6);
  assert.match(report.aggregationRule, /repeated Num values are retained/);
});

test("rejects invalid source validation inputs deterministically", async () => {
  const eml = await fixture();
  assert.throws(() => parseEpccProfitEmail(eml.replace(EPCC_PROFIT_SUBJECT, "Unexpected report")), /Unexpected subject/);
  assert.throws(() => parseEpccProfitEmail(eml.replace('rawvalue=3D"182.6"', 'rawvalue=3D"not-a-number"')), /numeric parsing errors/);
  assert.throws(() => parseEpccProfitEmail(eml.replace(/Profit Total<\/td=\r?\n>/, "Missing Profit</td=\r\n>")), /columns are missing/);
  assert.throws(() => parseEpccProfitEmail(eml.replace(">1/7/2026</td>", ">1/8/2026</td>")), /exactly one report month/);
});

test("requires an organisation and local EML input while remaining dry-run by default", () => {
  assert.deepEqual(parseEpccProfitImportArgs(["--organisation-id", "global", "--input", fixturePath]), { organisationId: null, input: fixturePath, apply: false });
  assert.throws(() => parseEpccProfitImportArgs(["--input", fixturePath]), /organisation-id is required/);
  assert.throws(() => parseEpccProfitImportArgs(["--organisation-id", "global"]), /input must point/);
});
