import Link from "next/link";

import { LoginForm } from "@/components/auth/LoginForm";
import { Panel } from "@/components/ui/Panel";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#333333] px-6 py-10">
      <Panel className="w-full max-w-sm border-white/15 bg-card/95 shadow-xl shadow-black/30">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div className="grid gap-2">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-md border border-[#e1ddba]/35 bg-[#111111] text-xs font-semibold tracking-[0.08em] text-[#e1ddba]"
              aria-label="Pins & Knuckles"
            >
              P&amp;K
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">
                Pins &amp; Knuckles
              </p>
              <h1 className="text-xl font-semibold">Pins Hub Login</h1>
            </div>
          </div>
          <Link
            href="/"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Back to home
          </Link>
        </div>
        <LoginForm />
      </Panel>
    </main>
  );
}
