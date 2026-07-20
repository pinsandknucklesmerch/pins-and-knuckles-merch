import { Gauge } from "lucide-react";
import Link from "next/link";
import { LogoutButton } from "@/components/auth/LogoutButton";
import Image from "next/image";
import { hubFeatureNavigation } from "@/config/hubNavigation";

const navItems = [
  { href: "/hub", label: "Dashboard", icon: Gauge },
  ...hubFeatureNavigation,
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
    <aside className="hidden w-60 shrink-0 border-r border-border/80 bg-card/65 px-3 py-4 backdrop-blur-md md:flex md:flex-col">
      <div>

          <Link href="/hub" className="mb-5 flex items-center rounded-md px-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
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
              className="flex h-9 items-center gap-2 rounded-md px-2 text-sm text-muted-foreground transition-colors hover:bg-primary/10 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <item.icon className="size-4" aria-hidden="true" />
              {item.label}
            </Link>
          ))}
        </nav>
      </div>

      <div className="mt-auto border-t border-border/80 pt-3">
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
