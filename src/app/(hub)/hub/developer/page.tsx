import { redirect } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import Link from "next/link";
import { loadDiagnosticInboxCounts } from "@/features/developer-diagnostics/data/issues";
import { loadOpenFeedbackCount } from "@/features/feedback/data/reports";
import { getCurrentPinsHubAccess, hasDeveloperAccess } from "@/lib/access/pinsHubAccess";

export default async function DeveloperPage() {
  const access = await getCurrentPinsHubAccess();
  if (!hasDeveloperAccess(access)) redirect("/hub");
  const [diagnostics, openFeedback] = await Promise.all([loadDiagnosticInboxCounts(), loadOpenFeedbackCount()]);
  return <AppShell pinsHubAccess={access}><PageHeader title="Developer" /><div className="grid gap-3 sm:grid-cols-2"><Link href="/hub/developer/feedback" className="rounded-md border border-border bg-card/60 p-4 text-sm font-medium transition-colors hover:bg-muted">Feedback · {openFeedback} open</Link><Link href="/hub/developer/diagnostics" className="rounded-md border border-border bg-card/60 p-4 text-sm font-medium transition-colors hover:bg-muted">Diagnostics · {diagnostics.open} open · {diagnostics.investigating} investigating</Link></div></AppShell>;
}
