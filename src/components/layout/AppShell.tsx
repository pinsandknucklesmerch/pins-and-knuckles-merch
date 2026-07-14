import { AccessDenied } from "@/components/layout/AccessDenied";
import { SidebarNav } from "@/components/layout/SidebarNav";
import { getCurrentPinsHubAccess } from "@/lib/access/pinsHubAccess";

type AppShellProps = {
  children: React.ReactNode;
};

export async function AppShell({ children }: AppShellProps) {
  const pinsHubAccess = await getCurrentPinsHubAccess();

  if (!pinsHubAccess.access) {
    return <AccessDenied userEmail={pinsHubAccess.user?.email ?? null} />;
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex min-h-screen">
        <SidebarNav
          accessLevel={pinsHubAccess.access.access_level}
          organisationRole={pinsHubAccess.membership?.role ?? null}
          userEmail={pinsHubAccess.user?.email ?? null}
        />
        <main className="min-w-0 flex-1 px-4 py-4 sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-6xl flex-col gap-4">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
