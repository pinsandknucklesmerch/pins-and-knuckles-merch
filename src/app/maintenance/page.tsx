import type { Metadata } from "next";
import Image from "next/image";
import { Wrench } from "lucide-react";

export const metadata: Metadata = {
  title: "Temporarily unavailable | Pins Hub",
  robots: { index: false, follow: false },
};

export default function MaintenancePage() {
  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-background px-5 py-10 text-foreground">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,hsl(var(--primary)/0.16),transparent_42%)]"
      />

      <section
        aria-labelledby="maintenance-title"
        className="relative w-full max-w-lg rounded-[var(--hub-panel-radius)] border border-border bg-card/85 p-6 shadow-2xl shadow-black/25 backdrop-blur sm:p-8"
      >
        <Image
          src="/branding/P&K_LOGO.png"
          alt="Pins & Knuckles"
          width={180}
          height={48}
          priority
          className="h-auto w-36"
        />

        <div className="mt-8 flex size-11 items-center justify-center rounded-[var(--hub-control-radius)] border border-primary/35 bg-primary/10 text-primary">
          <Wrench className="size-5" aria-hidden="true" />
        </div>

        <p className="mt-5 text-xs font-medium uppercase tracking-[0.16em] text-primary">
          Scheduled maintenance
        </p>
        <h1 id="maintenance-title" className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
          Pins Hub is temporarily unavailable
        </h1>
        <p className="mt-4 max-w-md text-sm leading-6 text-muted-foreground sm:text-base">
          We are carrying out some maintenance and testing. Please check back shortly.
        </p>

        <div className="mt-8 border-t border-border pt-4 text-xs text-muted-foreground">
          No action is needed. Please try again in a little while.
        </div>
      </section>
    </main>
  );
}
