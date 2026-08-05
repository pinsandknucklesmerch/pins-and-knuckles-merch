import { AccessDenied } from "@/components/layout/AccessDenied";
import { SidebarNav } from "@/components/layout/SidebarNav";
import Galaxy from "@/components/backgrounds/Galaxy";
import { getCurrentPinsHubAccess, type PinsHubAccessResult } from "@/lib/access/pinsHubAccess";

type AppShellProps = {
  children: React.ReactNode;
  pinsHubAccess?: PinsHubAccessResult;
  tvMode?: boolean;
  wideContent?: boolean;
};

export async function AppShell({ children, pinsHubAccess: suppliedPinsHubAccess, tvMode = false, wideContent = false }: AppShellProps) {
  const pinsHubAccess = suppliedPinsHubAccess ?? await getCurrentPinsHubAccess();

  if (!pinsHubAccess.access) {
    return <AccessDenied userEmail={pinsHubAccess.user?.email ?? null} />;
  }

  return (
    <div className="relative min-h-screen overflow-x-clip bg-background text-foreground">
      <div className="pointer-events-none fixed inset-0 z-0" aria-hidden="true">
        <Galaxy mouseRepulsion={false} mouseInteraction={false} density={0.7} glowIntensity={0.16} saturation={0} hueShift={140} twinkleIntensity={0.15} rotationSpeed={0.03} starSpeed={0.2} speed={0.4} transparent />
      </div>
      <div className={`relative z-10 flex min-h-screen flex-col ${tvMode ? "" : "md:flex-row"}`}>
        {!tvMode ? <SidebarNav
          accessLevel={pinsHubAccess.access.access_level}
        /> : null}
        <main className={`min-w-0 flex-1 ${tvMode ? "h-screen overflow-hidden px-4 py-4 sm:px-6" : "px-4 py-4 pt-[4.25rem] sm:px-6 md:pt-4 lg:px-8"}`}>
          <div className={`mx-auto flex h-full w-full flex-col gap-4 ${tvMode || wideContent ? "max-w-none" : "max-w-6xl"}`}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
