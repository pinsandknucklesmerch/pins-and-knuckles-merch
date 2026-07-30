import { Suspense } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { LoadingState } from "@/components/ui/LoadingState";
import MagicBento, { type MagicBentoItem } from "@/components/ui/MagicBento";
import { hubFeatureNavigation } from "@/config/hubNavigation";

const items: MagicBentoItem[] = hubFeatureNavigation.map((item) => ({
  id: item.href,
  title: item.label,
  href: item.href,
  icon: <item.icon size={20} strokeWidth={1.8} />,
}));

export default function HubPage() {
  return (
    <Suspense fallback={<LoadingState label="Loading hub" />}>
      <AppShell>
        <PageHeader
          title="Pins Hub"
        />
        <MagicBento
          items={items}
          enableBorderGlow
          cardSize="hub"
        />
      </AppShell>
    </Suspense>
  );
}
