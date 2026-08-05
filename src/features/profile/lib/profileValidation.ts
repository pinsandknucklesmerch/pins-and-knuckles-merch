export const PROFILE_DISPLAY_NAME_MAX_LENGTH = 120;

export function validateDisplayName(value: string) {
  const displayName = value.trim();
  if (!displayName) return { ok: false as const, error: "Enter a display name." };
  if (displayName.length > PROFILE_DISPLAY_NAME_MAX_LENGTH) return { ok: false as const, error: `Display name must be ${PROFILE_DISPLAY_NAME_MAX_LENGTH} characters or fewer.` };
  return { ok: true as const, value: displayName };
}
