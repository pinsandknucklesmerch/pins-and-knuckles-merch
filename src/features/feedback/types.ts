export const feedbackIssueTypes = ["bug", "incorrect_data", "suggestion", "other"] as const;
export const feedbackStatuses = ["new", "in_progress", "resolved", "closed"] as const;
export type FeedbackIssueType = (typeof feedbackIssueTypes)[number];
export type FeedbackStatus = (typeof feedbackStatuses)[number];

export type FeedbackReport = {
  id: string; organisation_id: string; submitted_by: string; issue_type: FeedbackIssueType; comment: string;
  attempted_action: string | null; page_route: string; user_agent: string | null; status: FeedbackStatus;
  developer_notes: string | null; created_at: string; updated_at: string; resolved_at: string | null; resolved_by: string | null;
  submitter_name: string | null;
};
