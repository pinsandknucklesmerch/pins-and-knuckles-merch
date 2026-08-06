import { createClient } from "@/lib/supabase/server";
import type { FeedbackIssueType, FeedbackReport, FeedbackStatus } from "../types";

export async function loadFeedbackReports(filters: { status?: string; issueType?: string } = {}) {
  const supabase = await createClient();
  let query = supabase.from("hub_feedback_reports").select("id,organisation_id,submitted_by,issue_type,comment,attempted_action,page_route,user_agent,status,developer_notes,created_at,updated_at,resolved_at,resolved_by,profiles!hub_feedback_reports_submitted_by_fkey(full_name)").order("created_at", { ascending: false });
  if (filters.status) query = query.eq("status", filters.status);
  if (filters.issueType) query = query.eq("issue_type", filters.issueType);
  const { data, error } = await query;
  if (error) return { reports: [] as FeedbackReport[], error: "Feedback reports are unavailable." };
  return { reports: (data ?? []).map((row) => ({ ...row, issue_type: row.issue_type as FeedbackIssueType, status: row.status as FeedbackStatus, submitter_name: (row.profiles as { full_name: string | null } | null)?.full_name ?? null })) as FeedbackReport[], error: null };
}

export async function loadOpenFeedbackCount() {
  const { count } = await (await createClient()).from("hub_feedback_reports").select("id", { count: "exact", head: true }).eq("status", "new");
  return count ?? 0;
}
