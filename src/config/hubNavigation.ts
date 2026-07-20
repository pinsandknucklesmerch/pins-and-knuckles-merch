import {
  Calculator,
  ChartNoAxesColumnIncreasing,
  FileText,
  Landmark,
  type LucideIcon,
} from "lucide-react";

export type HubFeatureNavigationItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

export const hubFeatureNavigation: HubFeatureNavigationItem[] = [
  { href: "/hub/sales-dashboard", label: "Sales Dashboard", icon: ChartNoAxesColumnIncreasing },
  { href: "/hub/calculators", label: "Calculators", icon: Calculator },
  { href: "/hub/pk-tax", label: "PK Tax", icon: Landmark },
  { href: "/hub/commercial-invoices", label: "Commercial Invoices", icon: FileText },
];
