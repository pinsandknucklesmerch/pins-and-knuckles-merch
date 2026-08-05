"use client";

import { useState } from "react";
import { ActionButton } from "@/components/ui/ActionButton";
import { feedback } from "@/components/ui/feedback";
import { sendPasswordRecoveryEmail } from "@/features/auth/lib/passwordRecovery";
import { createClient } from "@/lib/supabase/client";

export function ResetPasswordButton() {
  const [sending, setSending] = useState(false);
  async function sendResetEmail() {
    setSending(true);
    const supabase = createClient();
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user?.email) { setSending(false); feedback.error("Could not send the reset email."); return; }
    const { error } = await sendPasswordRecoveryEmail(supabase, user.email, window.location.origin);
    setSending(false);
    if (error) { feedback.error("Could not send the reset email."); return; }
    feedback.success("Reset email sent.");
  }
  return <ActionButton onClick={() => void sendResetEmail()} disabled={sending}>{sending ? "Sending reset" : "Reset password"}</ActionButton>;
}
