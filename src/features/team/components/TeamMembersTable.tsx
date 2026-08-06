"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ActionMenu } from "@/components/ui/ActionMenu";
import { Select } from "@/components/ui/Select";
import { feedback } from "@/components/ui/feedback";
import { resendInvite } from "../actions/users";
import type { TeamMember } from "../data/teamMembers";
import { USER_TABLE_COLUMNS } from "../lib/table";
import { UserEditDialog } from "./UserEditDialog";

const date = (value: string | null) => value ? new Intl.DateTimeFormat("en-ZA", { dateStyle: "medium" }).format(new Date(value)) : "—";

export function TeamMembersTable({ members, currentUserId }: { members: TeamMember[]; currentUserId?: string }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [role, setRole] = useState("all");
  const [status, setStatus] = useState("all");
  const [editing, setEditing] = useState<TeamMember | null>(null);
  const [pending, startTransition] = useTransition();
  const visible = useMemo(() => members.filter((member) => {
    const matchesQuery = `${member.fullName ?? ""} ${member.email ?? ""}`.toLowerCase().includes(query.toLowerCase());
    return matchesQuery && (role === "all" || member.role === role) && (status === "all" || member.status === status);
  }), [members, query, role, status]);

  function resend(member: TeamMember) {
    const data = new FormData(); data.set("membership_id", member.id);
    startTransition(async () => {
      const result = await resendInvite(undefined, data);
      if (result.status === "success") feedback.success(result.message ?? "Invitation resent."); else feedback.error(result.message ?? "Invitation could not be resent.");
    });
  }

  return <>
    <div className="flex flex-col gap-2 rounded-lg border border-border bg-card/70 p-3 md:flex-row">
      <input aria-label="Search users by name or email" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search name or email" className="h-9 min-w-0 flex-1 rounded-md bg-background px-2 text-sm outline-none focus:ring-2 focus:ring-primary" />
      <Select aria-label="Filter by role" value={role} onValueChange={setRole}><option value="all">All roles</option>{[...new Set(members.map((member) => member.role))].map((value) => <option key={value} value={value}>{value}</option>)}</Select>
      <Select aria-label="Filter by status" value={status} onValueChange={setStatus}><option value="all">All statuses</option><option value="Active">Active</option><option value="Inactive">Inactive</option><option value="Pending">Pending</option></Select>
    </div>
    <div className="overflow-x-auto rounded-lg border border-border bg-card/70">
      <table className="w-full min-w-[980px] text-left text-sm">
        <caption className="sr-only">User Access Management users</caption>
        <thead className="border-b border-border text-muted-foreground"><tr>{USER_TABLE_COLUMNS.map((heading) => <th key={heading} className="px-4 py-3 font-medium">{heading}</th>)}</tr></thead>
        <tbody>{visible.length ? visible.map((member) => <tr key={member.id} className="border-b border-border/70 last:border-0">
          <td className="px-4 py-3 font-medium">{member.fullName || "—"}</td><td className="px-4 py-3 text-muted-foreground">{member.email || "—"}</td>
          <td className="px-4 py-3"><span className={member.status === "Inactive" ? "text-muted-foreground" : member.status === "Pending" ? "text-amber-400" : "text-emerald-400"}>{member.status}</span></td>
          <td className="px-4 py-3 capitalize">{member.role}</td><td className="px-4 py-3 text-muted-foreground">{date(member.joinedDate)}</td><td className="px-4 py-3 text-muted-foreground">{date(member.lastActive)}</td>
          <td className="px-4 py-3"><ActionMenu label="Manage" pending={pending} items={[
            { label: "Edit user", onSelect: () => setEditing(member) },
            { label: "Change access", onSelect: () => setEditing(member) },
            ...(!member.isOwner && member.userId !== currentUserId ? [{ label: "View performance", onSelect: () => router.push(`/hub/team/${member.id}`) }] : []),
            ...(member.status === "Pending" ? [{ label: "Resend invite", onSelect: () => resend(member) }] : []),
            ...(!member.isOwner && member.userId !== currentUserId ? [{ label: member.status === "Inactive" ? "Reactivate" : "Deactivate", onSelect: () => setEditing(member) }] : []),
          ]} /></td>
        </tr>) : <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">{members.length ? "No users match these filters." : "No users in User Access Management."}</td></tr>}</tbody>
      </table>
    </div>
    {editing ? <UserEditDialog key={editing.id} member={editing} currentUserId={currentUserId} onClose={() => setEditing(null)} /> : null}
  </>;
}
