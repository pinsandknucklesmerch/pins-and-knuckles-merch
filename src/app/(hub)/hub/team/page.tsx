import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { LoadingState } from "@/components/ui/LoadingState";
import { getCurrentPinsHubAccess, hasAdminAccess } from "@/lib/access/pinsHubAccess";
import { InviteMemberForm } from "@/features/team/components/InviteMemberForm";
import { TeamMembersTable } from "@/features/team/components/TeamMembersTable";
import { getTeamMembers } from "@/features/team/data/teamMembers";
import { isOrganisationOwner } from "@/features/team/lib/invite";

export default function TeamPage() {
  return <Suspense fallback={<LoadingState label="Loading User Access Management" />}><TeamContent /></Suspense>;
}

async function TeamContent() {
  await connection();
  const access = await getCurrentPinsHubAccess();
  if (!hasAdminAccess(access) || !access.membership?.organisation_id) notFound();
  const members = await getTeamMembers(access.membership.organisation_id);
  return <AppShell><PageHeader title="User Access Management" />{isOrganisationOwner(access.membership.role) ? <InviteMemberForm /> : null}<TeamMembersTable members={members} currentUserId={access.user?.id} /></AppShell>;
}
