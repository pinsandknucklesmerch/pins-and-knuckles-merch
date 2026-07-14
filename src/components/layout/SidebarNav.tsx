import {
  Calculator,
  FileText,
  Gauge,
  Library,
  ReceiptText,
  Shirt,
} from "lucide-react";
import Link from "next/link";
import { LogoutButton } from "@/components/auth/LogoutButton";

const navItems = [
  { href: "/hub", label: "Dashboard", icon: Gauge },
  { href: "/hub", label: "Calculators", icon: Calculator },
  { href: "/hub", label: "Garments", icon: Shirt },
  { href: "/hub", label: "Invoices", icon: FileText },
  { href: "/hub", label: "PK Tax", icon: ReceiptText },
  { href: "/hub", label: "Reference", icon: Library },
];

type SidebarNavProps = {
  accessLevel: "admin" | "write" | "read";
  organisationRole: "owner" | "admin" | "manager" | "staff" | "viewer" | null;
  userEmail: string | null;
};

export function SidebarNav({
  accessLevel,
  organisationRole,
  userEmail,
}: SidebarNavProps) {
  return (
    <aside className="hidden w-60 shrink-0 border-r border-border bg-card/55 px-3 py-4 md:flex md:flex-col">
      <div>
        <Link href="/hub" className="mb-4 flex items-center gap-2 px-2">
          <span className="flex size-8 items-center justify-center rounded-md bg-primary text-sm font-bold text-primary-foreground">
            PK
          </span>
          <span className="text-sm font-semibold">Pins Hub</span>
        </Link>
        <nav className="space-y-1">
          {navItems.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="flex h-9 items-center gap-2 rounded-md px-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <item.icon className="size-4" aria-hidden="true" />
              {item.label}
            </Link>
          ))}
        </nav>
      </div>

      <div className="mt-auto border-t border-border pt-3">
        <p className="truncate px-2 text-xs text-muted-foreground">
          {userEmail ?? "Signed in"}
        </p>
        <div className="mt-2 grid grid-cols-2 gap-2 px-2 text-xs">
          <span className="rounded-md bg-secondary px-2 py-1 text-center text-foreground">
            {accessLevel}
          </span>
          <span className="rounded-md bg-secondary px-2 py-1 text-center text-foreground">
            {organisationRole ?? "member"}
          </span>
        </div>
        <LogoutButton />
      </div>
    </aside>
  );
}
