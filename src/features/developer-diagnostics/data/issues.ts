import { createClient } from "@/lib/supabase/server";
import type { DeveloperDiagnosticIssue } from "../types";

export async function loadDiagnosticIssues(filters: { status?: string; issueType?: string; month?: string; detection?: string } = {}) {
  const supabase = await createClient(); let query = supabase.from("developer_diagnostic_issues").select("*").order("last_detected_at", { ascending: false });
  if (filters.status) query = query.eq("status", filters.status); else query = query.in("status", ["open", "investigating"]);
  if (filters.issueType) query = query.eq("issue_type", filters.issueType);
  if (filters.month && /^\d{4}-\d{2}$/.test(filters.month)) { const [year, month] = filters.month.split("-").map(Number); query = query.eq("reporting_year", year).eq("reporting_month", month); }
  if (filters.detection === "current") query = query.is("no_longer_detected_at", null); if (filters.detection === "stale") query = query.not("no_longer_detected_at", "is", null);
  const { data, error } = await query; return { issues: (data ?? []) as DeveloperDiagnosticIssue[], error: error ? "Diagnostics are unavailable." : null };
}

export async function loadDiagnosticInboxCounts() {
  const supabase = await createClient();
  const [open, investigating] = await Promise.all([
    supabase.from("developer_diagnostic_issues").select("id", { count: "exact", head: true }).eq("status", "open"),
    supabase.from("developer_diagnostic_issues").select("id", { count: "exact", head: true }).eq("status", "investigating"),
  ]);
  return { open: open.count ?? 0, investigating: investigating.count ?? 0 };
}
