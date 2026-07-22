import type { TeamMember } from "../data/teamMembers";

export function TeamMembersTable({ members }: { members: TeamMember[] }) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-card/70">
      <table className="w-full min-w-[700px] text-left text-sm">
        <thead className="border-b border-border text-muted-foreground"><tr><th className="px-4 py-3 font-medium">Name</th><th className="px-4 py-3 font-medium">Email</th><th className="px-4 py-3 font-medium">Organisation role</th><th className="px-4 py-3 font-medium">Pins Hub access</th><th className="px-4 py-3 font-medium">Status</th></tr></thead>
        <tbody>{members.length ? members.map((member) => <tr key={member.id} className="border-b border-border/70 last:border-0"><td className="px-4 py-3">{member.fullName ?? "—"}</td><td className="px-4 py-3 text-muted-foreground">{member.email ?? "—"}</td><td className="px-4 py-3">{member.role}</td><td className="px-4 py-3">{member.accessLevel ?? "—"}</td><td className="px-4 py-3">{member.status}</td></tr>) : <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No team members.</td></tr>}</tbody>
      </table>
    </div>
  );
}
