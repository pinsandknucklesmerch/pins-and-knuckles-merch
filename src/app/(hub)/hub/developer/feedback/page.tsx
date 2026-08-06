import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { ErrorState } from "@/components/ui/ErrorState";
import { PageHeader } from "@/components/layout/PageHeader";
import { FeedbackInbox } from "@/features/feedback/components/FeedbackInbox";
import { loadFeedbackReports } from "@/features/feedback/data/reports";
import { getCurrentPinsHubAccess, hasDeveloperAccess } from "@/lib/access/pinsHubAccess";

type Props = { searchParams: Promise<{ status?: string; issueType?: string }> };
export default async function FeedbackPage({ searchParams }: Props) {
  const [access, params] = await Promise.all([getCurrentPinsHubAccess(), searchParams]);
  if (!hasDeveloperAccess(access)) redirect("/hub");
  const data = await loadFeedbackReports({ status: params.status, issueType: params.issueType });
  return <AppShell pinsHubAccess={access}><PageHeader title="Feedback" /><form method="get" className="flex flex-wrap gap-2"><select name="status" defaultValue={params.status ?? ""} className="h-9 rounded-md border bg-card px-2 text-sm"><option value="">All statuses</option><option value="new">New</option><option value="in_progress">In progress</option><option value="resolved">Resolved</option><option value="closed">Closed</option></select><select name="issueType" defaultValue={params.issueType ?? ""} className="h-9 rounded-md border bg-card px-2 text-sm"><option value="">All types</option><option value="bug">Bug</option><option value="incorrect_data">Incorrect data</option><option value="suggestion">Suggestion</option><option value="other">Other</option></select><button className="h-9 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground">Filter</button></form>{data.error ? <ErrorState title="Feedback unavailable" message={data.error} /> : <FeedbackInbox reports={data.reports} />}</AppShell>;
}
