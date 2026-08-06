export type AuthUserMetadata = Record<string, unknown> | null | undefined;

export function trimFullName(value: string | null | undefined) {
  return value?.trim() ?? "";
}

export function authDisplayNameMetadata(fullName: string, existingMetadata: AuthUserMetadata = {}) {
  const trimmedFullName = trimFullName(fullName);
  return { ...(existingMetadata ?? {}), full_name: trimmedFullName, display_name: trimmedFullName };
}

export function authDisplayNameMatches(metadata: AuthUserMetadata, fullName: string) {
  return metadata?.full_name === fullName && metadata.display_name === fullName;
}
