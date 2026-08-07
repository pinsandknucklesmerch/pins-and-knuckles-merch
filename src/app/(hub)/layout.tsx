import { updateCurrentUserLastActive } from "@/lib/access/updateLastActive";
import { getCurrentPinsHubAccess } from "@/lib/access/pinsHubAccess";

export default async function HubLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const access = await getCurrentPinsHubAccess();
  await updateCurrentUserLastActive(access);
  return children;
}
