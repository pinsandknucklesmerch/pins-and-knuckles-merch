import { createServerClient } from "@supabase/ssr";
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
  let supabaseResponse = NextResponse.next({
    request,
  });

  if (!hasEnvVars) {
    return supabaseResponse;
  }

  if (isPublicPath(pathname)) {
    return supabaseResponse;
  }

  if (!hasSupabaseAuthCookie(request)) {
    return pathname === "/" ? supabaseResponse : redirectToLogin(request);
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
