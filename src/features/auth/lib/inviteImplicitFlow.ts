export type InviteFragment =
  | { kind: "not-invite" }
  | { kind: "callback-error" }
  | { kind: "invalid-invite" }
  | { kind: "invite"; accessToken: string; refreshToken: string };

export function parseInviteFragment(hash: string): InviteFragment {
  const values = new URLSearchParams(hash.startsWith("#") ? hash.slice(1) : hash);

  if (values.has("error") || values.has("error_code") || values.has("error_description")) return { kind: "callback-error" };

  if (values.get("type") !== "invite") return { kind: "not-invite" };

  const accessToken = values.get("access_token");
  const refreshToken = values.get("refresh_token");
  if (!accessToken || !refreshToken) return { kind: "invalid-invite" };

  return { kind: "invite", accessToken, refreshToken };
}

export function safeUrlWithoutFragment(pathname: string, search: string) {
  return `${pathname}${search}`;
}

export function shouldProcessInviteCallback(hash: string, search: string) {
  const query = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  if (query.has("error") || query.has("error_code") || query.has("error_description") || query.has("code")) return true;
  return parseInviteFragment(hash).kind !== "not-invite";
}

type InviteDependencies = {
  setSession: (tokens: { access_token: string; refresh_token: string }) => Promise<{ error: unknown }>;
  clearFragment: () => void;
  replace: (path: string) => void;
};

export async function completeInviteFragment(
  fragment: InviteFragment,
  dependencies: InviteDependencies,
) {
  if (fragment.kind === "not-invite") return "unchanged" as const;
  if (fragment.kind === "invalid-invite" || fragment.kind === "callback-error") {
    dependencies.clearFragment();
    dependencies.replace("/auth/error");
    return "error" as const;
  }

  const { error } = await dependencies.setSession({
    access_token: fragment.accessToken,
    refresh_token: fragment.refreshToken,
  });
  dependencies.clearFragment();
  dependencies.replace(error ? "/auth/error" : "/auth/update-password?mode=invite");
  return error ? "error" as const : "redirected" as const;
}
