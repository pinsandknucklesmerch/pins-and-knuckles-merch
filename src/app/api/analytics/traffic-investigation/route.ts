import { getGa4TrafficInvestigation, Ga4ConfigurationError, Ga4OidcUnavailableError } from "@/features/analytics/server/ga4";
import { parseTrafficInvestigationRange } from "@/features/analytics/lib/trafficInvestigation";
import { getCurrentPinsHubAccess } from "@/lib/access/pinsHubAccess";

export async function GET(request: Request) {
  const access = await getCurrentPinsHubAccess();
  if (!access.authenticated || !access.access) return Response.json({ error: "Unauthorised" }, { status: 401 });

  const url = new URL(request.url);
  const startDate = url.searchParams.get("startDate");
  const endDate = url.searchParams.get("endDate");
  if (!parseTrafficInvestigationRange(startDate, endDate)) return Response.json({ error: "Invalid traffic investigation range." }, { status: 400 });

  try {
    const investigation = await getGa4TrafficInvestigation(startDate, endDate);
    return Response.json(investigation);
  } catch (error) {
    if (error instanceof Ga4ConfigurationError || error instanceof Ga4OidcUnavailableError) return Response.json({ error: "Website Analytics is unavailable." }, { status: 503 });
    console.error("Analytics traffic investigation failed", error instanceof Error ? error.message : "Unknown error");
    return Response.json({ error: "Website Analytics is temporarily unavailable." }, { status: 502 });
  }
}
