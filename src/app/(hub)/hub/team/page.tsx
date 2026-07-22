import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { getCurrentPinsHubAccess } from "@/lib/access/pinsHubAccess";
import { InviteMemberForm } from "@/features/team/components/InviteMemberForm";
import { TeamMembersTable } from "@/features/team/components/TeamMembersTable";
import { getTeamMembers } from "@/features/team/data/teamMembers";

export default function TeamPage() {
  return <Suspense fallback={null}><TeamContent /></Suspense>;
}

async function TeamContent() {
  await connection();
  const access = await getCurrentPinsHubAccess();
  if (access.access?.access_level !== "admin" || !access.membership?.organisation_id) notFound();
  const members = await getTeamMembers(access.membership.organisation_id);
  return <AppShell><PageHeader title="Team" /><InviteMemberForm /><TeamMembersTable members={members} /></AppShell>;
}
