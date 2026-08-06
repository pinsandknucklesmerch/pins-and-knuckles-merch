"use client";

import { useState } from "react";
import { ActionButton } from "@/components/ui/ActionButton";
import { FormField } from "@/components/ui/FormField";
import { feedback } from "@/components/ui/feedback";
import { updateOwnDisplayName } from "../actions/profileActions";
import type { ProfileDetails } from "../types";

export function ProfileDetailsForm({ profile }: { profile: ProfileDetails }) {
  const [displayName, setDisplayName] = useState(profile.displayName === "Unavailable" ? "" : profile.displayName);
  const [displayNameError, setDisplayNameError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function saveDisplayName(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setDisplayNameError(null);
    setSaving(true);
    const result = await updateOwnDisplayName(displayName);
    setSaving(false);
    if (result.fieldError) { setDisplayNameError(result.fieldError); return; }
    if (!result.ok) { feedback.error(result.message ?? "Could not update display name."); return; }
    setDisplayName(result.message ? displayName.trim() : displayName);
    feedback.success(result.message ?? "Display name updated.");
  }

  return <div className="grid gap-4">
    <form className="grid gap-3 sm:grid-cols-2" onSubmit={saveDisplayName}>
      <FormField label="Display name" error={displayNameError} id="display-name"><input name="display-name" value={displayName} onChange={(event) => setDisplayName(event.target.value)} maxLength={120} autoComplete="name" className="hub-native-control" /></FormField>
      <div className="grid content-end"><ActionButton type="submit" disabled={saving}>{saving ? "Saving" : "Save name"}</ActionButton></div>
    </form>
    <dl className="grid gap-3 border-t border-border pt-4 sm:grid-cols-3">
      <div className="grid gap-1"><dt className="text-xs font-medium text-muted-foreground">Email address</dt><dd className="truncate text-sm text-foreground">{profile.email}</dd></div>
      <div className="grid gap-1"><dt className="text-xs font-medium text-muted-foreground">Organisation</dt><dd className="truncate text-sm text-foreground">{profile.organisation}</dd></div>
      <div className="grid gap-1"><dt className="text-xs font-medium text-muted-foreground">Access role</dt><dd className="text-sm text-foreground">{profile.accessRole}</dd></div>
    </dl>
  </div>;
}
