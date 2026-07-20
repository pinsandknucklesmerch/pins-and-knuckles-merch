import {
  ChartNoAxesColumnIncreasing,
  Calculator,
  Gauge,
} from "lucide-react";
import Link from "next/link";
import { LogoutButton } from "@/components/auth/LogoutButton";
import Image from "next/image";


const navItems = [
  { href: "/hub", label: "Dashboard", icon: Gauge },
  {
    href: "/hub/sales-dashboard",
    label: "Sales Dashboard",
    icon: ChartNoAxesColumnIncreasing,
  },
  { href: "/hub/calculators", label: "Calculators", icon: Calculator },
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

          <Link href="/hub" className="mb-5 flex items-center px-2">
        <Image
          src="/branding/P&K_LOGO.png"
          alt="Pins & Knuckles"
          width={180}
          height={48}
          priority
          className="h-auto w-40"
        />
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
