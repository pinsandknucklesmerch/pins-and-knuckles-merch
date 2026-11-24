import type { EmailOtpType } from "@supabase/supabase-js";

const TOKEN_HASH_PATTERN = /^[A-Za-z0-9_-]{20,512}$/;

export type RecoveryConfirmationInput = {
  tokenHash: string;
  next: string;
};

export function getSafeAuthNextPath(next: string | null) {
  const fallback = "/auth/update-password";
  if (!next || !next.startsWith("/") || next.startsWith("//") || /[\\\u0000-\u001f\u007f]/.test(next)) {
    return fallback;
  }

  // URL parsing normalizes some inputs; check the resulting origin before redirecting.
  const origin = "https://pins-hub.invalid";
  try {
    return new URL(next, origin).origin === origin ? next : fallback;
  } catch {
    return fallback;
  }
}

export function parseRecoveryConfirmationInput(values: {
  tokenHash: string | null;
  type: string | null;
  next: string | null;
}): RecoveryConfirmationInput | null {
  const tokenHash = values.tokenHash?.trim();

  if (values.type !== "recovery" || !tokenHash || !TOKEN_HASH_PATTERN.test(tokenHash)) {
    return null;
  }

  return {
    tokenHash,
    next: getSafeAuthNextPath(values.next),
  };
}

export async function verifyRecoveryConfirmation(
  input: RecoveryConfirmationInput,
  verifyOtp: (params: { token_hash: string; type: EmailOtpType }) => Promise<{ error: unknown }>,
) {
  const { error } = await verifyOtp({
    token_hash: input.tokenHash,
    type: "recovery",
  });

  return error ? "error" as const : "verified" as const;
}
