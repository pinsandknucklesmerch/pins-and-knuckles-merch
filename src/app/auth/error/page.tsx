import Link from "next/link";
import { Panel } from "@/components/ui/Panel";

export default function AuthErrorPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <Panel className="w-full max-w-sm">
        <p className="text-xs font-medium text-muted-foreground">Pins Hub</p>
        <h1 className="mt-2 text-xl font-semibold">Auth link failed</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          The sign-in link is invalid or has expired.
        </p>
        <Link
          href="/login"
          className="mt-5 inline-flex h-9 items-center justify-center rounded-md border border-border px-3 text-sm font-medium"
        >
          Back to login
        </Link>
      </Panel>
    </main>
  );
}
