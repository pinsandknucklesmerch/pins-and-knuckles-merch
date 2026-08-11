"use server";

import { revalidatePath } from "next/cache";
import { getCurrentPinsHubAccess, hasDeveloperAccess } from "@/lib/access/pinsHubAccess";
import { createClient } from "@/lib/supabase/server";
import { feedbackIssueTypes, feedbackStatuses, type FeedbackIssueType, type FeedbackStatus } from "./types";

export type FeedbackActionState = { ok: boolean; message: string };
const fail = (message: string): FeedbackActionState => ({ ok: false, message });
const issueTypes = new Set<string>(feedbackIssueTypes);
const statuses = new Set<string>(feedbackStatuses);

export async function submitFeedbackReport(input: { issueType: string; comment: string; attemptedAction?: string; pageRoute: string; userAgent?: string }): Promise<FeedbackActionState> {
  const access = await getCurrentPinsHubAccess();
  if (!access.authenticated || !access.access || !access.membership?.organisation_id) return fail("You do not have access to Pins Hub.");
  const comment = input.comment.trim();
  const attemptedAction = input.attemptedAction?.trim() || null;
  if (!issueTypes.has(input.issueType)) return fail("Select a valid issue type.");
  if (!comment) return fail("Comment is required.");
  if (comment.length > 4000 || (attemptedAction?.length ?? 0) > 2000) return fail("Your report is too long.");
  const route = input.pageRoute.startsWith("/hub") ? input.pageRoute.slice(0, 500) : "/hub";
  const supabase = await createClient();
  const { error } = await supabase.rpc("submit_hub_feedback_report", { p_issue_type: input.issueType as FeedbackIssueType, p_comment: comment, p_attempted_action: attemptedAction ?? "", p_page_route: route, p_user_agent: input.userAgent?.slice(0, 1000) || "" });
  return error ? fail("Issue report could not be submitted.") : { ok: true, message: "Issue report submitted." };
}

export async function updateFeedbackReport(input: { id: string; status: string; developerNotes: string }): Promise<FeedbackActionState> {
  const access = await getCurrentPinsHubAccess();
  if (!hasDeveloperAccess(access)) return fail("You do not have permission to update reports.");
  if (!statuses.has(input.status) || !input.id) return fail("Enter a valid report update.");
  if (input.developerNotes.length > 4000) return fail("Developer notes are too long.");
  const supabase = await createClient();
  const { error } = await supabase.rpc("update_hub_feedback_report", { p_id: input.id, p_status: input.status as FeedbackStatus, p_developer_notes: input.developerNotes.trim() });
  if (error) return fail("Report could not be updated.");
  revalidatePath("/hub/developer/feedback");
  return { ok: true, message: "Report updated." };
}
