import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import MagicBento, { type MagicBentoItem } from "@/components/ui/MagicBento";

const reportingOptions: MagicBentoItem[] = [
  {
    id: "epcc-report",
    title: "EPCC Report",
    href: "/hub/reporting/epcc",
  },
  {
    id: "export-metrics",
    title: "Export Metrics",
    href: "/hub/reporting/metrics",
  },
];

export default function ReportingPage() {
  return (
    <AppShell>
      <PageHeader title="Reporting" />
      <MagicBento items={reportingOptions} enableBorderGlow cardSize="index" />
    </AppShell>
  );
}
