import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { Panel } from "@/components/ui/Panel";
import { ProfileAccountSummary } from "@/features/profile/components/ProfileAccountSummary";
import { ProfilePerformanceSection } from "@/features/profile/components/ProfilePerformanceSection";
import { getAdminProfilePerformance } from "@/features/profile/data/memberPerformance";
import { getCurrentPinsHubAccess } from "@/lib/access/pinsHubAccess";

type Props = { params: Promise<{ membershipId: string }> };

export default async function TeamMemberProfilePage({ params }: Props) {
  const [{ membershipId }, access] = await Promise.all([params, getCurrentPinsHubAccess()]);
  if (access.access?.access_level !== "admin") notFound();
  const subject = await getAdminProfilePerformance(access, membershipId);
  if (!subject) notFound();
  const now = new Date();
  return <AppShell pinsHubAccess={access}><PageHeader title="User profile" /><Panel title="Account details"><ProfileAccountSummary subject={subject} /></Panel><ProfilePerformanceSection performance={subject.performance} initialYear={now.getFullYear()} initialMonth={now.getMonth() + 1} /></AppShell>;
}
