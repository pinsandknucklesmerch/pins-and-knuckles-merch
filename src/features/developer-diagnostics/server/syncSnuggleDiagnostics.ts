import { createAdminClient } from "@/lib/supabase/admin";
import type { SnuggleWarning } from "@/features/sales-dashboard/server/snuggleProfit";
import type { DeveloperDiagnosticIssue, DiagnosticIssueType } from "../types";

type DetectedIssue = Pick<DeveloperDiagnosticIssue, "source" | "issue_key" | "issue_type" | "reporting_year" | "reporting_month" | "affected_item_id" | "affected_member_key" | "summary">;
const typeFor = (warning: SnuggleWarning): DiagnosticIssueType => warning.kind === "invalid-profit" ? "invalid_formula_value" : warning.kind === "multi-assignee" ? "multi_assignee" : warning.kind;

export function buildSnuggleDetectedIssues(warnings: SnuggleWarning[]): DetectedIssue[] {
  const detected = warnings.flatMap((warning) => {
    if (!warning.resolvedYear || !warning.resolvedMonth) return [];
    const issueType = typeFor(warning);
    const memberKey = warning.mondayPersonId ?? null;
    const keyPart = warning.itemId || memberKey || "aggregate";
    return [{ source: "snuggle", issue_key: `snuggle:${warning.resolvedYear}-${String(warning.resolvedMonth).padStart(2, "0")}:${issueType}:${keyPart}`, issue_type: issueType, reporting_year: warning.resolvedYear, reporting_month: warning.resolvedMonth, affected_item_id: warning.itemId || null, affected_member_key: memberKey, summary: `${issueType.replaceAll("_", " ")} detected for Snuggle item ${warning.itemId}` }];
  });
  const excluded = new Map<string, { year: number; month: number; count: number }>();
  for (const warning of warnings) if (warning.resolvedYear && warning.resolvedMonth && ["unassigned", "unmapped", "multi-assignee"].includes(warning.kind)) {
    const key = `${warning.resolvedYear}-${warning.resolvedMonth}`; const current = excluded.get(key) ?? { year: warning.resolvedYear, month: warning.resolvedMonth, count: 0 }; current.count += 1; excluded.set(key, current);
  }
  for (const row of excluded.values()) detected.push({ source: "snuggle", issue_key: `snuggle:${row.year}-${String(row.month).padStart(2, "0")}:excluded_from_member_attribution:aggregate`, issue_type: "excluded_from_member_attribution", reporting_year: row.year, reporting_month: row.month, affected_item_id: null, affected_member_key: null, summary: `${row.count} Snuggle item${row.count === 1 ? "" : "s"} excluded from member attribution` });
  return detected;
}

export async function syncSnuggleDiagnosticIssues(organisationId: string, warnings: SnuggleWarning[]) {
  const admin = createAdminClient(); const detected = buildSnuggleDetectedIssues(warnings); const now = new Date().toISOString();
  const { data: existing, error } = await admin.from("developer_diagnostic_issues").select("id,issue_key,occurrence_count,no_longer_detected_at").eq("organisation_id", organisationId).eq("source", "snuggle");
  if (error) return { error: "Diagnostics are unavailable." };
  const known = new Map((existing ?? []).map((row) => [row.issue_key, row]));
  for (const issue of detected) {
    const row = known.get(issue.issue_key);
    if (row) await admin.from("developer_diagnostic_issues").update({ ...issue, occurrence_count: row.occurrence_count + 1, last_detected_at: now, no_longer_detected_at: null }).eq("id", row.id);
    else await admin.from("developer_diagnostic_issues").insert({ organisation_id: organisationId, ...issue, occurrence_count: 1, status: "open", first_detected_at: now, last_detected_at: now });
  }
  const detectedKeys = new Set(detected.map((issue) => issue.issue_key));
  const staleIds = (existing ?? []).filter((row) => !detectedKeys.has(row.issue_key) && !row.no_longer_detected_at).map((row) => row.id);
  if (staleIds.length) await admin.from("developer_diagnostic_issues").update({ no_longer_detected_at: now }).in("id", staleIds);
  return { error: null };
}
