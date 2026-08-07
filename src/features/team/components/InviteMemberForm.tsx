"use client";

import { useActionState, useEffect, useRef, type FormEvent } from "react";
import { inviteMember } from "../actions/inviteMember";
import { initialInviteActionState } from "../types";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { feedback, isInlineValidation } from "@/components/ui/feedback";
import { mondayIdentities } from "@/features/sales-dashboard/domain/memberIdentity";
import { pinsHubAccessLabels, pinsHubAccessLevels } from "@/lib/access/pinsHubRoles";

export function InviteMemberForm() {
  const [state, formAction, pending] = useActionState(inviteMember, initialInviteActionState);
  const formRef = useRef<HTMLFormElement>(null);
  const resetSuccessRef = useRef<string | null>(null);
  const submittedRef = useRef(false);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    if (!pending && !submittedRef.current) {
      submittedRef.current = true;
      return;
    }
    event.preventDefault();
  }

  function unlockForChangedInvite() {
    if (!pending) submittedRef.current = false;
  }

  useEffect(() => {
    if (state.status !== "success" || resetSuccessRef.current === state.message) return;
    formRef.current?.reset();
    resetSuccessRef.current = state.message;
  }, [state.message, state.status]);
  useEffect(() => {
    if (!state.message) return;
    if (state.status === "success") feedback.success(state.message);
    else if (!isInlineValidation(state.message)) feedback.error(state.message);
  }, [state]);

  return (
    <form ref={formRef} action={formAction} onSubmit={handleSubmit} onChange={unlockForChangedInvite} className="grid gap-3 rounded-lg border border-border bg-card/70 p-4 sm:grid-cols-2 lg:grid-cols-6">
      <label className="grid gap-1 text-sm">
        <span>Full name</span>
        <Input required name="full_name" maxLength={200} />
      </label>
      <label className="grid gap-1 text-sm">
        <span>Email</span>
        <Input required type="email" name="email" maxLength={320} />
      </label>
      <label className="grid gap-1 text-sm">
        <span>Organisation role</span>
        <Select name="organisation_role" defaultValue="admin">
          <option value="admin">Admin</option><option value="manager">Manager</option><option value="staff">Staff</option><option value="viewer">Viewer</option>
        </Select>
      </label>
      <label className="grid gap-1 text-sm">
        <span>Pins Hub access</span>
        <Select name="access_level" defaultValue="admin">
          {pinsHubAccessLevels.map((level) => <option key={level} value={level}>{pinsHubAccessLabels[level]}</option>)}
        </Select>
      </label>
      <label className="grid gap-1 text-sm">
        <span>Monday account</span>
        <Select name="monday_member_id" defaultValue="none"><option value="none">Not linked</option>{mondayIdentities().map((person) => <option key={person.id} value={person.id}>{person.displayName}</option>)}</Select>
      </label>
      <div className="flex items-end">
        <button disabled={pending} type="submit" className="h-9 w-full rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          {pending ? "Sending…" : "Send invite"}
        </button>
      </div>
      {state.message && state.status !== "success" && isInlineValidation(state.message) ? <p role="alert" className="sm:col-span-2 lg:col-span-6 text-sm text-destructive">{state.message}</p> : null}
    </form>
  );
}
