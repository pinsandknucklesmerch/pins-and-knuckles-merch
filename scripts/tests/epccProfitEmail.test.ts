import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { parseEpccProfitImportArgs } from "../import-epcc-profit-email.ts";
import { isEpccAuthoritativePeriod, parseEpccProfitEmail, type EpccProfitEmailReport } from "../lib/epccProfitEmail.ts";
import { runEpccProfitIngestion, type EpccProfitStore } from "../../src/features/sales-dashboard/server/epccProfitImporter.ts";

const fixturePath = "scripts/tests/fixtures/epcc-profit-report.eml";
const fixture = () => readFile(fixturePath, "utf8");

test("parses the final overall Total row and ignores salesperson subtotals", async () => {
  const report = parseEpccProfitEmail(await fixture());
  assert.deepEqual({ sales: report.totalSales, profit: report.monthlyProfit, tax: report.totalPkTax }, {
    sales: 192581.71, profit: 93853.79, tax: 2353.60,
  });
  assert.deepEqual(report.reportPeriod, { year: 2026, month: 7 });
  assert.equal(report.reportStart, "2026-07-01");
  assert.equal(report.reportEnd, "2026-07-31");
});

test("parses a base64 multipart Gmail message", async () => {
  const body = "1 July 2026 - 31 July 2026\nTotal £192,581.71 93,853.79 2,353.60";
  const eml = `From: system@sent-via.netsuite.com\nSubject: Pins Knuckles Profits V2 ALL SALES\nDate: Fri, 24 Jul 2026 09:00:00 +0100\nMessage-ID: <multipart@example.test>\nContent-Type: multipart/alternative; boundary="report"\n\n--report\nContent-Type: text/plain; charset=utf-8\nContent-Transfer-Encoding: base64\n\n${Buffer.from(body).toString("base64")}\n--report--`;
  assert.equal(parseEpccProfitEmail(eml).monthlyProfit, 93853.79);
});

test("rejects malformed totals and reports before July 2026", async () => {
  const eml = await fixture();
  assert.throws(() => parseEpccProfitEmail(eml.replace("93,853.79", "not-money")), /malformed/);
  assert.throws(() => parseEpccProfitEmail(eml.replaceAll("July", "June")), /before July 2026/);
  assert.equal(isEpccAuthoritativePeriod(2026, 6), false);
  assert.equal(isEpccAuthoritativePeriod(2026, 7), true);
  assert.equal(isEpccAuthoritativePeriod(2027, 1), true);
});

test("CLI is dry-run by default and accepts report filters", () => {
  assert.deepEqual(parseEpccProfitImportArgs(["--message-id", "abc", "--year", "2026", "--month", "7"]), {
    apply: false, messageId: "abc", year: 2026, month: 7,
  });
  assert.equal(parseEpccProfitImportArgs(["--apply"]).apply, true);
});

test("dry-run does not write", async () => {
  let writes = 0;
  const raw = await fixture();
  const result = await runEpccProfitIngestion({ apply: false }, {
    gmail: { findMessages: async () => [{ id: "dry-run", receivedAt: "2026-07-24T08:00:00.000Z", raw }] },
    store: { ingest: async () => { writes += 1; return "applied"; } },
  });
  assert.equal(result.outcome, "dry-run");
  assert.equal(writes, 0);
});

test("same message is idempotent, older cannot overwrite, and newer preserves Monday metrics", async () => {
  const raw = await fixture();
  const monthlyRow = { monthly_profit: 100, monthly_profit_source: "monday", quotes_done: 12, orders_processed: 8, sales_inbox_enquiries: 30, converted: 7, data_source: "monday" };
  const seen = new Set<string>();
  let latest = "";
  const store: EpccProfitStore = {
    async ingest(report: EpccProfitEmailReport) {
      if (seen.has(report.messageId)) return "duplicate";
      seen.add(report.messageId);
      if (latest && report.receivedAt <= latest) return "older";
      latest = report.receivedAt;
      monthlyRow.monthly_profit = report.monthlyProfit;
      monthlyRow.monthly_profit_source = "epcc_email";
      return "applied";
    },
  };
  const run = (id: string, receivedAt: string, profit = "93,853.79") => runEpccProfitIngestion({ apply: true }, {
    gmail: { findMessages: async () => [{ id, receivedAt, raw: raw.replace("93,853.79", profit) }] }, store,
  });
  assert.equal((await run("new", "2026-07-24T09:00:00.000Z")).outcome, "applied");
  assert.equal((await run("new", "2026-07-24T09:00:00.000Z")).outcome, "duplicate");
  assert.equal((await run("old", "2026-07-23T09:00:00.000Z", "80,000.00")).outcome, "older");
  assert.equal(monthlyRow.monthly_profit, 93853.79);
  assert.equal((await run("newer", "2026-07-25T09:00:00.000Z", "95,000.00")).outcome, "applied");
  assert.deepEqual(monthlyRow, { monthly_profit: 95000, monthly_profit_source: "epcc_email", quotes_done: 12, orders_processed: 8, sales_inbox_enquiries: 30, converted: 7, data_source: "monday" });
});
