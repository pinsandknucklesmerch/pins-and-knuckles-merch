import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { connection } from "next/server";

import Galaxy from "@/components/backgrounds/Galaxy";
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
    <main className="relative min-h-screen overflow-hidden bg-black text-foreground">
      <div className="absolute inset-0 z-0">
        <Galaxy
          mouseRepulsion
          mouseInteraction
          density={1}
          glowIntensity={0.3}
          saturation={0}
          hueShift={140}
          twinkleIntensity={0.3}
          rotationSpeed={0.1}
          repulsionStrength={2}
          autoCenterRepulsion={0}
          starSpeed={0.5}
          speed={1}
          transparent
        />
      </div>

      <div className="relative z-10 flex min-h-screen items-center justify-center px-6 py-10">
        <section className="grid w-full max-w-sm gap-5">
          <div className="grid justify-items-center gap-3 text-center">
            <Image
              src="/branding/P&K_LOGO.png"
              alt="Pins & Knuckles"
              width={220}
              height={57}
              priority
              className="h-auto w-44"
            />
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
