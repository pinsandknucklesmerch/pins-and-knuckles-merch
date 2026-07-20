import { Suspense } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { LoadingState } from "@/components/ui/LoadingState";
import MagicBento, { type MagicBentoItem } from "@/components/ui/MagicBento";
import { BarChart3, Calculator } from "lucide-react";

const items: MagicBentoItem[] = [
  {
    id: "sales-dashboard",
    title: "Sales Dashboard",
    href: "/hub/sales-dashboard",
    label: "Operations",
    icon: <BarChart3 size={20} strokeWidth={1.8} />,
    status: "Ready",
  },
  {
    id: "calculators",
    title: "Calculators",
    href: "/hub/calculators",
    label: "Pricing",
    icon: <Calculator size={20} strokeWidth={1.8} />,
    status: "Ready",
  },
];

export default function HubPage() {
  return (
    <Suspense fallback={<LoadingState label="Loading hub" />}>
      <AppShell>
        <PageHeader
          title="Dashboard"
        />
        <MagicBento
          items={items}
          textAutoHide={true}
          enableStars
          enableSpotlight
          enableBorderGlow
          enableTilt={false}
          enableMagnetism={false}
          clickEffect
          spotlightRadius={400}
          particleCount={12}
          glowColor="222, 59, 67"
          disableAnimations={false}
        />
      </AppShell>
    </Suspense>
  );
}
