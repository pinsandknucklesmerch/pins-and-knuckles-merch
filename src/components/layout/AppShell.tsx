import { AccessDenied } from "@/components/layout/AccessDenied";
import { SidebarNav } from "@/components/layout/SidebarNav";
import Galaxy from "@/components/backgrounds/Galaxy";
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
    <div className="relative min-h-screen overflow-x-hidden bg-background text-foreground">
      <div className="pointer-events-none fixed inset-0 z-0" aria-hidden="true">
        <Galaxy mouseRepulsion={false} mouseInteraction={false} density={0.7} glowIntensity={0.16} saturation={0} hueShift={140} twinkleIntensity={0.15} rotationSpeed={0.03} starSpeed={0.2} speed={0.4} transparent />
      </div>
      <div className="relative z-10 flex min-h-screen">
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
