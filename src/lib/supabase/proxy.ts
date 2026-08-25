import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { hasEnvVars } from "../utils";

// TEMPORARY: remove after identifying the repeated /hub request source.
let hubRequestDiagnosticId = 0;

function isPublicPath(pathname: string) {
  return pathname.startsWith("/login") || pathname.startsWith("/auth");
}

function hasSupabaseAuthCookie(request: NextRequest) {
  return request.cookies
    .getAll()
    .some(
      ({ name }) => name.startsWith("sb-") && name.includes("-auth-token"),
    );
}

function isNavigationPrefetch(request: NextRequest) {
  return request.headers.get("next-router-prefetch") === "1"
    || request.headers.get("purpose") === "prefetch"
    || request.headers.get("x-middleware-prefetch") === "1";
}

function logHubRequestDiagnostic(request: NextRequest, options: {
  hasAuthCookie: boolean;
  isPrefetch: boolean;
}) {
  if (request.nextUrl.pathname !== "/hub") {
    return;
  }

  const { headers } = request;
  const willGetClaims = hasEnvVars && options.hasAuthCookie && !options.isPrefetch;

  console.info(
    "[hub-request-diagnostic]",
    JSON.stringify({
      id: ++hubRequestDiagnosticId,
      pathname: request.nextUrl.pathname,
      method: request.method,
      purpose: headers.get("purpose"),
      secPurpose: headers.get("sec-purpose"),
      nextRouterPrefetch: headers.get("next-router-prefetch"),
      middlewarePrefetch: headers.get("x-middleware-prefetch"),
      rsc: headers.get("rsc"),
      nextUrl: headers.get("next-url"),
      hasNextRouterStateTree: headers.has("next-router-state-tree"),
      secFetchDest: headers.get("sec-fetch-dest"),
      secFetchMode: headers.get("sec-fetch-mode"),
      secFetchSite: headers.get("sec-fetch-site"),
      referer: headers.get("referer"),
      isPrefetch: options.isPrefetch,
      getClaims: willGetClaims ? "run" : "bypass",
    }),
  );
}

function redirectToLogin(request: NextRequest, reason?: string) {
  const url = request.nextUrl.clone();
  url.pathname = "/login";

  if (reason) {
    url.searchParams.set("error", reason);
  }

  return NextResponse.redirect(url);
}

export async function updateSession(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const hasAuthCookie = hasSupabaseAuthCookie(request);
  const isPrefetch = isNavigationPrefetch(request);

  logHubRequestDiagnostic(request, { hasAuthCookie, isPrefetch });

  let supabaseResponse = NextResponse.next({
    request,
  });

  if (!hasEnvVars) {
    return supabaseResponse;
  }

  if (isPublicPath(pathname)) {
    return supabaseResponse;
  }

  if (!hasAuthCookie) {
    return pathname === "/" ? supabaseResponse : redirectToLogin(request);
  }

  // A prefetch never renders the route for the user. The foreground request
  // still verifies the session here, while route data remains RLS-backed.
  if (isPrefetch) {
    return supabaseResponse;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const { data, error } = await supabase.auth.getClaims();

  if (error) {
    const errorCode = "code" in error ? String(error.code) : null;
    if (errorCode === "over_request_rate_limit") {
      return redirectToLogin(request, "auth-rate-limit");
    }

    return pathname === "/" ? redirectToLogin(request) : supabaseResponse;
  }

  if (pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = data?.claims ? "/hub" : "/login";
    return NextResponse.redirect(url);
  }

  if (!data?.claims) {
    return redirectToLogin(request);
  }

  return supabaseResponse;
}
