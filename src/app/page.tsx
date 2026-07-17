import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";

import SoftAurora from "@/components/backgrounds/SoftAurora";
import { Panel } from "@/components/ui/Panel";
import { createClient } from "@/lib/supabase/server";

async function LandingPanel() {
  await connection();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return <LoginPanel isAuthenticated={Boolean(user)} />;
}

function LoginPanel({ isAuthenticated }: { isAuthenticated: boolean }) {
  if (isAuthenticated) {
    return (
      <Panel className="border-white/15 bg-card/95 shadow-xl shadow-black/30 backdrop-blur">
        <Link
          href="/hub"
          className="inline-flex h-9 w-full items-center justify-center rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Open Pins Hub
        </Link>
      </Panel>
    );
  }

  return (
    <Panel className="border-white/15 bg-card/95 shadow-xl shadow-black/30 backdrop-blur">
      <div className="grid gap-3">
        <Link
          href="/login"
          className="inline-flex h-9 w-full items-center justify-center rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Sign in with email
        </Link>
        <button
          type="button"
          disabled
          className="flex h-9 w-full items-center justify-between rounded-md border border-border bg-secondary px-3 text-sm font-medium text-secondary-foreground opacity-65"
        >
          <span>Continue with Microsoft</span>
          <span className="text-xs text-muted-foreground">Coming soon</span>
        </button>
        <button
          type="button"
          disabled
          className="flex h-9 w-full items-center justify-between rounded-md border border-border bg-secondary px-3 text-sm font-medium text-secondary-foreground opacity-65"
        >
          <span>Continue with Google</span>
          <span className="text-xs text-muted-foreground">Coming soon</span>
        </button>
      </div>
    </Panel>
  );
}

export default function Home() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#333333] text-foreground">
      <div className="absolute inset-0 z-0">
        <SoftAurora color1="#e1ddba" color2="#de3b43" />
      </div>

      <div className="relative z-10 flex min-h-screen items-center justify-center px-6 py-10">
        <section className="grid w-full max-w-sm gap-5">
          <div className="grid justify-items-center gap-3 text-center">
            <div
              className="flex h-14 w-14 items-center justify-center rounded-md border border-[#e1ddba]/35 bg-[#111111]/85 text-sm font-semibold tracking-[0.08em] text-[#e1ddba]"
              aria-label="Pins & Knuckles"
            >
              P&amp;K
            </div>
            <h1 className="text-3xl font-semibold text-[#f4f0d0]">Pins Hub</h1>
          </div>

          <Suspense fallback={<LoginPanel isAuthenticated={false} />}>
            <LandingPanel />
          </Suspense>
        </section>
      </div>
    </main>
  );
}
