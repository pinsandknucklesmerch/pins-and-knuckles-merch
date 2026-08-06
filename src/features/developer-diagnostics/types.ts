export const diagnosticStatuses = ["open", "investigating", "resolved", "ignored"] as const;
export type DiagnosticStatus = (typeof diagnosticStatuses)[number];
export type DiagnosticIssueType = "unassigned" | "unmapped" | "multi_assignee" | "invalid_formula_value" | "excluded_from_member_attribution";
export type DeveloperDiagnosticIssue = {
  id: string; organisation_id: string; source: string; issue_key: string; issue_type: DiagnosticIssueType;
  reporting_year: number; reporting_month: number; affected_item_id: string | null; affected_member_key: string | null;
  summary: string; occurrence_count: number; status: DiagnosticStatus; developer_notes: string | null;
  first_detected_at: string; last_detected_at: string; no_longer_detected_at: string | null;
  resolved_at: string | null; resolved_by: string | null; created_at: string; updated_at: string;
};
