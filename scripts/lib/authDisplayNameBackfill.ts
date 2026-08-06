import { authDisplayNameMatches, authDisplayNameMetadata, trimFullName, type AuthUserMetadata } from "../../src/features/team/lib/authDisplayName.ts";

export type AuthDisplayNameBackfillProfile = { id: string | null; full_name: string | null };

export type AuthDisplayNameBackfillDecision =
  | { action: "skip" }
  | { action: "update"; userId: string; metadata: Record<string, unknown> };

export function planAuthDisplayNameBackfill(profile: AuthDisplayNameBackfillProfile, metadata?: AuthUserMetadata): AuthDisplayNameBackfillDecision {
  const fullName = trimFullName(profile.full_name);
  if (!profile.id || !fullName || authDisplayNameMatches(metadata, fullName)) return { action: "skip" };
  return { action: "update", userId: profile.id, metadata: authDisplayNameMetadata(fullName, metadata) };
}
