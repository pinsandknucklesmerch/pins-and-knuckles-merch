import { clearAuthCookiesAtScopes, createServerClient, type CookieMethodsServer } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { hasEnvVars } from "../utils";

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

function redirectToLogin(request: NextRequest, reason?: string) {
  const url = request.nextUrl.clone();
  url.pathname = "/login";

  if (reason) {
    url.searchParams.set("error", reason);
  }

  return NextResponse.redirect(url);
}

function withSessionCookies(response: NextResponse, sessionResponse: NextResponse) {
  sessionResponse.cookies.getAll().forEach((cookie) => response.cookies.set(cookie));
  return response;
}

export async function updateSession(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const isPublic = pathname === "/" || isPublicPath(pathname);
  const hasAuthCookie = hasSupabaseAuthCookie(request);
  const isPrefetch = isNavigationPrefetch(request);

  let supabaseResponse = NextResponse.next({
    request,
  });

  if (!hasEnvVars) {
    return supabaseResponse;
  }

  // Password updates read the session in a Server Component, which cannot
  // persist refreshes or expired-session cookie deletions itself.
  if (isPublicPath(pathname) && pathname !== "/auth/update-password") {
    return supabaseResponse;
  }

  if (!hasAuthCookie) {
    return isPublic ? supabaseResponse : redirectToLogin(request);
  }

  // A prefetch never renders the route for the user. The foreground request
  // still verifies the session here, while route data remains RLS-backed.
  if (isPrefetch) {
    return supabaseResponse;
  }

  const incomingCookies = request.cookies.getAll();
  const cookieMethods = {
    getAll() {
      return request.cookies.getAll();
    },
    setAll(cookiesToSet) {
      cookiesToSet.forEach(({ name, value, options }) => {
        if (options.maxAge === 0) {
          request.cookies.delete(name);
        } else {
          request.cookies.set(name, value);
        }
      });
      const previousCookies = supabaseResponse.cookies.getAll();
      supabaseResponse = NextResponse.next({ request });
      previousCookies.forEach((cookie) => supabaseResponse.cookies.set(cookie));
      cookiesToSet.forEach(({ name, value, options }) =>
        supabaseResponse.cookies.set(name, value, options),
      );
    },
  } satisfies CookieMethodsServer;

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    { cookies: cookieMethods },
  );

  const { data, error } = await supabase.auth.getClaims();

  if (error) {
    const errorCode = "code" in error ? String(error.code) : null;
    if (errorCode === "refresh_token_not_found" || errorCode === "refresh_token_already_used") {
      // Match the default project namespace used by the current Supabase clients.
      // The SSR helper discovers every cookie chunk without another auth request.
      const projectRef = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).hostname.split(".")[0];
      const storageKey = `sb-${projectRef}-auth-token`;
      for (const key of [storageKey, `${storageKey}-user`]) {
        await clearAuthCookiesAtScopes({
          getAll: () => incomingCookies,
          setAll: cookieMethods.setAll,
          storageKey: key,
          scopes: [{}],
        });
      }

      return pathname === "/auth/update-password"
        ? supabaseResponse
        : withSessionCookies(redirectToLogin(request), supabaseResponse);
    }

    if (errorCode === "over_request_rate_limit") {
      return pathname === "/auth/update-password"
        ? supabaseResponse
        : withSessionCookies(redirectToLogin(request, "auth-rate-limit"), supabaseResponse);
    }

    return pathname === "/"
      ? withSessionCookies(redirectToLogin(request), supabaseResponse)
      : supabaseResponse;
  }

  if (pathname === "/") {
    const url = request.nextUrl.clone();
    url.pathname = data?.claims ? "/hub" : "/login";
    return withSessionCookies(NextResponse.redirect(url), supabaseResponse);
  }

  if (!data?.claims && !isPublic) {
    return withSessionCookies(redirectToLogin(request), supabaseResponse);
  }

  return supabaseResponse;
}
