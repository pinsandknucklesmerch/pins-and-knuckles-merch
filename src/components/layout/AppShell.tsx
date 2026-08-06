import { AccessDenied } from "@/components/layout/AccessDenied";
import { SidebarNav } from "@/components/layout/SidebarNav";
import { BackgroundLayer } from "@/components/backgrounds/BackgroundLayer";
import { getCurrentPinsHubAccess, hasAdminAccess, hasDeveloperAccess, type PinsHubAccessResult } from "@/lib/access/pinsHubAccess";

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
      <BackgroundLayer variant="hub" />
      <div className={`relative z-10 flex min-h-screen flex-col ${tvMode ? "" : "md:flex-row"}`}>
        {!tvMode ? <SidebarNav
          canAdmin={hasAdminAccess(pinsHubAccess)}
          canDeveloper={hasDeveloperAccess(pinsHubAccess)}
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
