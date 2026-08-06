import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { AddUserForm } from "@/features/team/components/AddUserForm";
import { getCurrentPinsHubAccess } from "@/lib/access/pinsHubAccess";
import { canManageOrganisationUsers } from "@/lib/access/pinsHubRoles";
export default async function AddUserPage() { const access = await getCurrentPinsHubAccess(); if (!canManageOrganisationUsers(access.access?.access_level, access.membership?.role)) notFound(); return <AppShell pinsHubAccess={access}><PageHeader title="Add User" /><AddUserForm /></AppShell>; }
