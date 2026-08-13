import assert from "node:assert/strict";
import test from "node:test";
import { cronDataMayBeStale, cronDiagnosticStatus, isCronOverdue, latestCronRuns } from "../../developer-diagnostics/data/cronRunDetection.ts";
import { cronRunDurationMs, runWithCronHistory, safeCronErrorMessage, safeCronMetadata } from "../server/cronRunHistory.ts";
import { buildSalesDashboardStaleWarnings } from "../lib/cronRunStatus.ts";

const row = (job_name: "epcc-profit" | "monday-sales-sync", status: "running" | "success" | "failed", started_at: string, completed_at: string | null = started_at) => ({ id: `${job_name}-${status}-${started_at}`, organisation_id: "org", job_name, reporting_year: 2026, reporting_month: 8, started_at, completed_at, status, duration_ms: 120, summary: null, error_message: status === "failed" ? "failed" : null, metadata: {}, created_at: started_at });

test("cron history separates jobs and selects latest and latest successful runs", () => {
  const rows = [row("epcc-profit", "failed", "2026-08-11T09:00:00Z"), row("epcc-profit", "success", "2026-08-10T09:00:00Z"), row("monday-sales-sync", "success", "2026-08-11T09:15:00Z")];
  const epcc = latestCronRuns(rows, "epcc-profit");
  assert.equal(epcc.latest?.status, "failed");
  assert.equal(epcc.latestSuccessful?.started_at, "2026-08-10T09:00:00Z");
  assert.equal(latestCronRuns(rows, "monday-sales-sync").latest?.job_name, "monday-sales-sync");
});

test("cron missed-run detection honors each UTC schedule and grace period", () => {
  assert.equal(isCronOverdue("epcc-profit", new Date("2026-08-11T08:34:59Z")), false);
  assert.equal(isCronOverdue("epcc-profit", new Date("2026-08-11T08:35:00Z")), true);
  assert.equal(isCronOverdue("monday-sales-sync", new Date("2026-08-11T08:44:59Z")), false);
  assert.equal(isCronOverdue("monday-sales-sync", new Date("2026-08-11T08:45:00Z")), true);
  assert.equal(isCronOverdue("epcc-profit", new Date("2026-08-11T10:00:00Z"), row("epcc-profit", "success", "2026-08-11T08:06:00Z")), false);
});

test("run lifecycle values keep reporting duration and sensitive values out of persistence payloads", () => {
  assert.equal(cronRunDurationMs("2026-08-11T08:00:00Z", new Date("2026-08-11T08:00:01.250Z")), 1250);
  assert.deepEqual(safeCronMetadata({ outcome: "updated", durationMs: 1250, token: "do-not-store", emailBody: "do-not-store" }), { outcome: "updated", durationMs: 1250 });
  assert.equal(safeCronErrorMessage(new Error("token=super-secret")), "token=[redacted]");
});

test("cron history records a successful lifecycle without changing the sync result", async () => {
  const calls: string[] = [];
  const result = await runWithCronHistory({
    jobName: "monday-sales-sync",
    start: async () => { calls.push("start"); return { id: "run-1", startedAt: "2026-08-11T08:15:00Z" }; },
    run: async () => { calls.push("sync"); return "updated"; },
    complete: async () => { calls.push("complete"); },
    fail: async () => { calls.push("fail"); },
  });
  assert.equal(result, "updated");
  assert.deepEqual(calls, ["start", "sync", "complete"]);
});

test("a history start failure does not prevent the cron sync", async () => {
  let synced = false;
  const result = await runWithCronHistory({
    jobName: "epcc-profit",
    start: async () => { throw new Error("permission denied"); },
    run: async () => { synced = true; return "updated"; },
    complete: async () => { throw new Error("not reached"); },
    fail: async () => { throw new Error("not reached"); },
  });
  assert.equal(result, "updated");
  assert.equal(synced, true);
});

test("a history completion failure does not change the cron business result", async () => {
  const result = await runWithCronHistory({
    jobName: "monday-sales-sync",
    start: async () => ({ id: "run-1", startedAt: "2026-08-11T08:15:00Z" }),
    run: async () => "unchanged",
    complete: async () => { throw new Error("history unavailable"); },
    fail: async () => {},
  });
  assert.equal(result, "unchanged");
});

test("failed cron runs persist a concise error when history is available", async () => {
  let persisted: unknown = null;
  await assert.rejects(() => runWithCronHistory({
    jobName: "epcc-profit",
    start: async () => ({ id: "run-1", startedAt: "2026-08-11T08:05:00Z" }),
    run: async () => { throw new Error("source unavailable"); },
    complete: async () => {},
    fail: async (_run, error) => { persisted = safeCronErrorMessage(error); },
  }), /source unavailable/);
  assert.equal(persisted, "source unavailable");
});

test("cron status distinguishes failed, overdue, never-run, and fresh successful data", () => {
  const successful = row("monday-sales-sync", "success", "2026-08-11T08:16:00Z");
  assert.equal(cronDiagnosticStatus(null, false), "never run");
  assert.equal(cronDiagnosticStatus(row("epcc-profit", "failed", "2026-08-11T08:06:00Z"), true), "failed");
  assert.equal(cronDiagnosticStatus(null, true), "overdue");
  assert.equal(cronDiagnosticStatus(successful, false), "successful");
  assert.equal(cronDataMayBeStale("failed"), true);
  assert.equal(cronDataMayBeStale("overdue"), true);
  assert.equal(cronDataMayBeStale("successful"), false);
});

test("dashboard warning identifies stale sources and clears after today's successful scheduled run", () => {
  const now = new Date("2026-08-11T10:00:00Z");
  const stale = buildSalesDashboardStaleWarnings([row("monday-sales-sync", "failed", "2026-08-11T08:16:00Z")], 2026, 8, now);
  assert.deepEqual(stale, [
    { jobName: "epcc-profit", message: "Sales data may be out of date — EPCC Profit sync has not completed successfully today." },
    { jobName: "monday-sales-sync", message: "Sales data may be out of date — Monday sync has not completed successfully today." },
  ]);
  assert.deepEqual(buildSalesDashboardStaleWarnings([
    row("epcc-profit", "success", "2026-08-11T08:06:00Z"),
    row("monday-sales-sync", "success", "2026-08-11T08:16:00Z"),
  ], 2026, 8, now), []);
});
