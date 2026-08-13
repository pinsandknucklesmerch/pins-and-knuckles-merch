export const CRON_JOB_NAMES = ["epcc-profit", "monday-sales-sync"] as const;
export type CronJobName = (typeof CRON_JOB_NAMES)[number];
export type CronRunStatus = "running" | "success" | "failed";
export type ReportingPeriod = { year: number; month: number };
export type CronRunMetadata = Record<string, string | number | boolean | null>;
export type CronHistoryClient = {
  start: typeof startCronRun;
  complete: typeof completeCronRun;
  fail: typeof failCronRun;
};

export type CronRunHistoryRow = {
  id: string;
  organisation_id: string;
  job_name: CronJobName;
  reporting_year: number;
  reporting_month: number;
  started_at: string;
  completed_at: string | null;
  status: CronRunStatus;
  duration_ms: number | null;
  summary: string | null;
  error_message: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

const SENSITIVE_KEY = /(secret|token|credential|authorization|password|cookie|body|oauth|service.?role|api.?key)/i;
const SAFE_METADATA_KEY = /^[a-zA-Z][a-zA-Z0-9_]{0,48}$/;

export function safeCronMetadata(metadata: CronRunMetadata = {}) {
  return Object.fromEntries(Object.entries(metadata).filter(([key, value]) => {
    return SAFE_METADATA_KEY.test(key) && !SENSITIVE_KEY.test(key) && (value === null || typeof value === "string" || typeof value === "number" || typeof value === "boolean");
  }));
}

export function safeCronErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return message
    .replace(/(authorization|token|secret|password|credential|api[_-]?key)\s*[:=]\s*[^\s,;]+/gi, "$1=[redacted]")
    .slice(0, 2000);
}

export function currentCronReportingPeriod(now = new Date()): ReportingPeriod {
  return { year: now.getUTCFullYear(), month: now.getUTCMonth() + 1 };
}

async function adminClient() {
  const { createAdminClient } = await import("../../../lib/supabase/admin.ts");
  return createAdminClient();
}

export function cronRunDurationMs(startedAt: string, now = new Date()) {
  return Math.max(0, now.getTime() - new Date(startedAt).getTime());
}

export async function startCronRun(input: { organisationId: string; jobName: CronJobName; reportingPeriod: ReportingPeriod; metadata?: CronRunMetadata; startedAt?: Date }) {
  const startedAt = input.startedAt ?? new Date();
  const { data, error } = await (await adminClient()).from("cron_run_history").insert({
    organisation_id: input.organisationId,
    job_name: input.jobName,
    reporting_year: input.reportingPeriod.year,
    reporting_month: input.reportingPeriod.month,
    started_at: startedAt.toISOString(),
    status: "running",
    metadata: safeCronMetadata(input.metadata),
  }).select("id,started_at").single();
  if (error || !data) throw new Error(`Could not start cron run history: ${error?.message ?? "No row returned"}`);
  return { id: data.id, startedAt: data.started_at };
}

export async function completeCronRun(input: { id: string; startedAt: string; summary: string; reportingPeriod?: ReportingPeriod; metadata?: CronRunMetadata; completedAt?: Date }) {
  const completedAt = input.completedAt ?? new Date();
  const { error } = await (await adminClient()).from("cron_run_history").update({
    ...(input.reportingPeriod ? { reporting_year: input.reportingPeriod.year, reporting_month: input.reportingPeriod.month } : {}),
    completed_at: completedAt.toISOString(), status: "success", duration_ms: cronRunDurationMs(input.startedAt, completedAt),
    summary: input.summary.slice(0, 500), metadata: safeCronMetadata(input.metadata),
  }).eq("id", input.id);
  if (error) throw new Error(`Could not complete cron run history: ${error.message}`);
}

export async function failCronRun(input: { id: string; startedAt: string; error: unknown; metadata?: CronRunMetadata; completedAt?: Date }) {
  const completedAt = input.completedAt ?? new Date();
  const { error } = await (await adminClient()).from("cron_run_history").update({
    completed_at: completedAt.toISOString(), status: "failed", duration_ms: cronRunDurationMs(input.startedAt, completedAt),
    summary: "Run failed", error_message: safeCronErrorMessage(input.error), metadata: safeCronMetadata(input.metadata),
  }).eq("id", input.id);
  if (error) throw new Error(`Could not fail cron run history: ${error.message}`);
}

export const cronRunHistory = { start: startCronRun, complete: completeCronRun, fail: failCronRun };

/**
 * Runs the ingestion independently of its audit trail.  Cron history is useful
 * operational data, never a precondition for the source sync itself.
 */
export async function runWithCronHistory<Result>(input: {
  jobName: CronJobName;
  start: () => Promise<{ id: string; startedAt: string }>;
  run: () => Promise<Result>;
  complete: (historyRun: { id: string; startedAt: string }, result: Result) => Promise<void>;
  fail: (historyRun: { id: string; startedAt: string }, error: unknown) => Promise<void>;
}) {
  let historyRun: { id: string; startedAt: string } | null = null;
  try {
    historyRun = await input.start();
  } catch (error) {
    console.error(`Could not start ${input.jobName} cron run history`, error);
  }

  try {
    const result = await input.run();
    if (historyRun) {
      try { await input.complete(historyRun, result); }
      catch (error) { console.error(`Could not complete ${input.jobName} cron run history`, error); }
    }
    return result;
  } catch (error) {
    if (historyRun) {
      try { await input.fail(historyRun, error); }
      catch (historyError) { console.error(`Could not fail ${input.jobName} cron run history`, historyError); }
    }
    throw error;
  }
}
