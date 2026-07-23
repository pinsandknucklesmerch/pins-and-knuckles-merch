import { Suspense } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { LoadingState } from "@/components/ui/LoadingState";
import MagicBento, { type MagicBentoItem } from "@/components/ui/MagicBento";

const euCalculators: MagicBentoItem[] = [
  {
    id: "eu-standard",
    title: "EU Standard",
    label: "EU · EUR",
    href: "/hub/calculators/eu/standard",
    status: "Available",
  },
  {
    id: "eu-us-clients",
    title: "EU US Clients",
    label: "EU · USD",
    href: "/hub/calculators/eu/us-clients",
    status: "Coming soon",
    disabled: true,
  },
];

const ukCalculators: MagicBentoItem[] = [
  {
    id: "uk-trade",
    title: "UK Trade",
    label: "UK · GBP",
    href: "/hub/calculators/uk/trade",
    status: "Coming soon",
    disabled: true,
  },
];

export default function CalculatorsPage() {
  return (
    <Suspense fallback={<LoadingState label="Loading calculators" />}>
      <AppShell>
        <PageHeader title="Calculators" />
        <div className="space-y-5">
          <section aria-labelledby="eu-calculators-heading" className="space-y-2">
            <h2 id="eu-calculators-heading" className="text-sm font-semibold text-foreground">
              EU
            </h2>
            <MagicBento
              items={euCalculators}
              enableStars
              enableSpotlight
              enableBorderGlow
              enableTilt={false}
              enableMagnetism={false}
              clickEffect
              glowColor="222, 59, 67"
            />
          </section>
          <section aria-labelledby="uk-calculators-heading" className="space-y-2">
            <h2 id="uk-calculators-heading" className="text-sm font-semibold text-foreground">
              UK
            </h2>
            <MagicBento
              items={ukCalculators}
              enableStars
              enableSpotlight
              enableBorderGlow
              enableTilt={false}
              enableMagnetism={false}
              clickEffect
              glowColor="222, 59, 67"
            />
          </section>
        </div>
      </AppShell>
    </Suspense>
  );
}
