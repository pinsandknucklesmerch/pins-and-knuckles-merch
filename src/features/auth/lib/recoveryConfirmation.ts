import type { EmailOtpType } from "@supabase/supabase-js";

const TOKEN_HASH_PATTERN = /^[A-Za-z0-9_-]{20,512}$/;

export type RecoveryConfirmationInput = {
  tokenHash: string;
  next: string;
};

export function getSafeAuthNextPath(next: string | null) {
  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return "/auth/update-password";
  }

  return next;
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
