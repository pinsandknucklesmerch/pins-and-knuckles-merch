import "../../features/sales-dashboard/styles/metricui.generated.css";
import { updateCurrentUserLastActive } from "@/lib/access/updateLastActive";

export default async function HubLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  await updateCurrentUserLastActive();
  return children;
}
