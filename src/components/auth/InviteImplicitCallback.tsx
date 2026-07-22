"use client";

import { useEffect, useState } from "react";

import { completeInviteFragment, parseInviteFragment, safeUrlWithoutFragment, shouldProcessInviteCallback } from "@/features/auth/lib/inviteImplicitFlow";
import { createClient } from "@/lib/supabase/client";

export function InviteImplicitCallback() {
  const [isPreparing, setIsPreparing] = useState(false);

  useEffect(() => {
    const invite = parseInviteFragment(window.location.hash);
    const query = new URLSearchParams(window.location.search);

    let active = true;
    const clearFragment = () => {
      window.history.replaceState(
        window.history.state,
        "",
        safeUrlWithoutFragment(window.location.pathname, window.location.search),
      );
    };
    const clearSensitiveState = () => {
      window.history.replaceState(window.history.state, "", window.location.pathname);
    };

    async function establishInviteSession() {
      const hasQueryError = query.has("error") || query.has("error_code") || query.has("error_description");
      const code = query.get("code");
      if (!shouldProcessInviteCallback(window.location.hash, window.location.search)) return;

      setIsPreparing(true);
      if (hasQueryError) {
        clearSensitiveState();
        window.location.replace("/auth/error");
        return;
      }
      const supabase = createClient();
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        clearSensitiveState();
        window.location.replace(error ? "/auth/error" : "/auth/update-password?mode=invite");
        return;
      }
      await completeInviteFragment(invite, {
        setSession: (tokens) => supabase.auth.setSession(tokens),
        clearFragment,
        replace: (path) => window.location.replace(path),
      });
      if (!active) return;
    }

    void establishInviteSession();
    return () => {
      active = false;
    };
  }, []);

  if (!isPreparing) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-background px-6">
      <p className="text-sm text-muted-foreground">Preparing your account…</p>
    </div>
  );
}
