import { createClient } from "@/lib/supabase/server";
import { type EmailOtpType } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function getSafeNextPath(next: string | null) {
  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return "/auth/update-password";
  }

  return next;
}

function getVerifiedRedirectPath(type: EmailOtpType | null, next: string) {
  if (type === "invite") {
    return "/auth/update-password?mode=invite";
  }

  return next;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = getSafeNextPath(searchParams.get("next"));
  const verifiedRedirectPath = getVerifiedRedirectPath(type, next);
  const supabase = await createClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(new URL(verifiedRedirectPath, request.url));
    }

    console.error("[auth_confirm] exchangeCodeForSession failed", {
      message: error.message,
      status: error.status,
    });
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type,
    });

    if (!error) {
      return NextResponse.redirect(new URL(verifiedRedirectPath, request.url));
    }

    console.error("[auth_confirm] verifyOtp failed", {
      message: error.message,
      status: error.status,
    });
  }

  return NextResponse.redirect(new URL("/auth/error", request.url));
}
