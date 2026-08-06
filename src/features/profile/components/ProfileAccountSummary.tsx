import type { ProfilePerformanceSubject } from "../data/memberPerformance";

export function ProfileAccountSummary({ subject }: { subject: ProfilePerformanceSubject }) {
  return <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><div><dt className="text-xs text-muted-foreground">Full name</dt><dd className="mt-1 text-sm font-medium">{subject.displayName}</dd></div><div><dt className="text-xs text-muted-foreground">Email address</dt><dd className="mt-1 truncate text-sm font-medium">{subject.email}</dd></div><div><dt className="text-xs text-muted-foreground">Organisation role</dt><dd className="mt-1 text-sm font-medium capitalize">{subject.role}</dd></div><div><dt className="text-xs text-muted-foreground">Monday account</dt><dd className="mt-1 text-sm font-medium">{subject.mondayMemberName ?? "Not linked"}</dd></div></dl>;
}
