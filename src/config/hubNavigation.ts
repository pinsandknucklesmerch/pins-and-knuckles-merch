import {
  Calculator,
  ChartNoAxesColumnIncreasing,
  ChartNoAxesCombined,
  FileChartColumn,
  FileText,
  Landmark,
  Database,
  UserRound,
  Wrench,
  type LucideIcon,
} from "lucide-react";

export type HubFeatureNavigationItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  children?: Array<{ label: string; href: string }>;
};

export const hubFeatureNavigation: HubFeatureNavigationItem[] = [
  { href: "/hub/sales-dashboard", label: "Sales Dashboard", icon: ChartNoAxesColumnIncreasing },
  {
    href: "/hub/reporting", label: "Reporting", icon: FileChartColumn,
    children: [
      { label: "EPCC Report", href: "/hub/reporting/epcc" },
      { label: "Export Metrics", href: "/hub/reporting/metrics" },
    ],
  },
  { href: "/hub/analytics", label: "Analytics", icon: ChartNoAxesCombined },
  {
    href: "/hub/calculators", label: "Calculators", icon: Calculator,
    children: [
      { label: "EU Standard", href: "/hub/calculators/eu/standard" },
      { label: "EU US Clients", href: "/hub/calculators/eu/us-clients" },
      { label: "UK Trade", href: "/hub/calculators/uk/trade" },
      { label: "UK Standard", href: "/hub/calculators/uk/standard" },
    ],
  },
  { href: "/hub/pk-tax", label: "PK Tax", icon: Landmark },
  { href: "/hub/commercial-invoices", label: "Commercial Invoices", icon: FileText },
  {
    href: "/hub/data", label: "Data Management", icon: Database,
    children: [
      { label: "Garments", href: "/hub/data/garments" },
      { label: "Product Types", href: "/hub/data/product-types" },
      { label: "Invoice Companies", href: "/hub/data/invoice-companies" },
    ],
  },
];

export const hubProfileNavigation = { href: "/hub/profile", label: "Profile", icon: UserRound } satisfies HubFeatureNavigationItem;
export const hubDeveloperNavigation = { href: "/hub/developer", label: "Developer", icon: Wrench, children: [{ label: "Feedback", href: "/hub/developer/feedback" }, { label: "Diagnostics", href: "/hub/developer/diagnostics" }] } satisfies HubFeatureNavigationItem;
