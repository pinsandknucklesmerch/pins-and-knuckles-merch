import { Suspense } from "react";
import { headers } from "next/headers";
import { AppShell } from "@/components/layout/AppShell";
import { PageHeader } from "@/components/layout/PageHeader";
import { LoadingState } from "@/components/ui/LoadingState";
import MagicBento, { type MagicBentoItem } from "@/components/ui/MagicBento";
import { hubFeatureNavigation } from "@/config/hubNavigation";

const items: MagicBentoItem[] = hubFeatureNavigation.map((item) => ({
  id: item.href,
  title: item.label,
  href: item.href,
  icon: <item.icon size={20} strokeWidth={1.8} />,
}));

// TEMPORARY: remove after identifying the repeated /hub request source.
let hubRequestDiagnosticId = 0;

async function logHubRequestDiagnostic() {
  const requestHeaders = await headers();
  const isPrefetch = requestHeaders.get("next-router-prefetch") === "1"
    || requestHeaders.get("purpose") === "prefetch"
    || requestHeaders.get("x-middleware-prefetch") === "1";

  console.info(
    "[hub-request-diagnostic]",
    JSON.stringify({
      id: ++hubRequestDiagnosticId,
      method: "GET",
      pathname: "/hub",
      purpose: requestHeaders.get("purpose"),
      secPurpose: requestHeaders.get("sec-purpose"),
      nextRouterPrefetch: requestHeaders.get("next-router-prefetch"),
      middlewarePrefetch: requestHeaders.get("x-middleware-prefetch"),
      rsc: requestHeaders.get("rsc"),
      nextUrl: requestHeaders.get("next-url"),
      hasNextRouterStateTree: requestHeaders.has("next-router-state-tree"),
      secFetchDest: requestHeaders.get("sec-fetch-dest"),
      secFetchMode: requestHeaders.get("sec-fetch-mode"),
      secFetchSite: requestHeaders.get("sec-fetch-site"),
      referer: requestHeaders.get("referer"),
      isPrefetch,
      getClaims: "bypass (proxy is not registered)",
    }),
  );
}

export default async function HubPage() {
  await logHubRequestDiagnostic();

  return (
    <Suspense fallback={<LoadingState label="Loading hub" />}>
      <AppShell>
        <PageHeader
          title="Pins Hub"
        />
        <MagicBento
          items={items}
          enableBorderGlow
          cardSize="hub"
        />
      </AppShell>
    </Suspense>
  );
}
