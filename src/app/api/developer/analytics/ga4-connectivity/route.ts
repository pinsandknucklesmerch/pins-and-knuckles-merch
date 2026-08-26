import { getGa4LastSevenDaysReport, Ga4ConfigurationError, Ga4OidcUnavailableError } from "@/features/analytics/server/ga4";
import { getCurrentPinsHubAccess, hasDeveloperAccess } from "@/lib/access/pinsHubAccess";


export async function GET() {
  const access = await getCurrentPinsHubAccess();
  if (!access.authenticated || !access.access) {
    return Response.json({ error: "Unauthorised" }, { status: 401 });
  }
  if (!hasDeveloperAccess(access)) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    return Response.json({ ok: true, ...(await getGa4LastSevenDaysReport()) });
  } catch (error) {
    if (error instanceof Ga4ConfigurationError || error instanceof Ga4OidcUnavailableError) console.error(error.message);
    else console.error("GA4 connectivity check failed");
    return Response.json({ ok: false, error: "GA4 connectivity check failed." }, { status: 500 });
  }
}
