import { NextResponse, type NextRequest } from "next/server";

import {
  parseRecoveryConfirmationInput,
  verifyRecoveryConfirmation,
} from "@/features/auth/lib/recoveryConfirmation";
import { createClient } from "@/lib/supabase/server";

function errorRedirect(request: NextRequest, reason: "recovery-link-invalid" | "recovery-link-expired") {
  return NextResponse.redirect(new URL(`/auth/error?error=${reason}`, request.url));
}

function getStringValue(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value : null;
}

export async function POST(request: NextRequest) {
  const formData = await request.formData();
  const input = parseRecoveryConfirmationInput({
    tokenHash: getStringValue(formData, "token_hash"),
    type: getStringValue(formData, "type"),
    next: getStringValue(formData, "next"),
  });

  if (!input) return errorRedirect(request, "recovery-link-invalid");

  const supabase = await createClient();
  const result = await verifyRecoveryConfirmation(input, (params) => supabase.auth.verifyOtp(params));

  if (result !== "verified") return errorRedirect(request, "recovery-link-expired");

  return NextResponse.redirect(new URL(input.next, request.url));
}
