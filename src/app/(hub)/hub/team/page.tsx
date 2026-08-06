import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { LoadingState } from "@/components/ui/LoadingState";
import { getCurrentPinsHubAccess, hasAdminAccess } from "@/lib/access/pinsHubAccess";
import Link from "next/link";
import { TeamMembersTable } from "@/features/team/components/TeamMembersTable";
import { getTeamMembers } from "@/features/team/data/teamMembers";
import { canManageOrganisationUsers } from "@/lib/access/pinsHubRoles";

export default function TeamPage() {
  return <Suspense fallback={<LoadingState label="Loading User Access Management" />}><TeamContent /></Suspense>;
}

async function TeamContent() {
  await connection();
  const access = await getCurrentPinsHubAccess();
  if (!hasAdminAccess(access) || !access.membership?.organisation_id) notFound();
  const members = await getTeamMembers(access.membership.organisation_id);
  return <AppShell><div className="flex items-center justify-between gap-3"><PageHeader title="User Access Management" />{canManageOrganisationUsers(access.access?.access_level, access.membership.role) ? <Link href="/hub/team/add" className="h-9 rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground">Add User</Link> : null}</div><TeamMembersTable members={members} currentUserId={access.user?.id} /></AppShell>;
}
