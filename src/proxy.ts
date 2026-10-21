import { updateSession } from "@/lib/supabase/proxy";
import { NextResponse, type NextRequest } from "next/server";

const MAINTENANCE_MODE_ENABLED = true;

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/maintenance") return NextResponse.next();

  if (MAINTENANCE_MODE_ENABLED && !pathname.startsWith("/api/")) {
    const maintenanceUrl = request.nextUrl.clone();
    maintenanceUrl.pathname = "/maintenance";
    maintenanceUrl.search = "";
    return NextResponse.redirect(maintenanceUrl);
  }

  return updateSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
