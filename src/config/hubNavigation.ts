import {
  Calculator,
  ChartNoAxesColumnIncreasing,
  FileText,
  Landmark,
  Database,
  UserRound,
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
    href: "/hub/calculators", label: "Calculators", icon: Calculator,
    children: [
      { label: "EU Standard", href: "/hub/calculators/eu/standard" },
      { label: "EU US Clients", href: "/hub/calculators/eu/us-clients" },
      { label: "UK Trade", href: "/hub/calculators/uk/trade" },
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
