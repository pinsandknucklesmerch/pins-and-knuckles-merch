"use client";

import { useActionState, useEffect, useRef, type FormEvent } from "react";
import { inviteMember } from "../actions/inviteMember";
import { initialInviteActionState } from "../types";

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

  return (
    <form ref={formRef} action={formAction} onSubmit={handleSubmit} onChange={unlockForChangedInvite} className="grid gap-3 rounded-lg border border-border bg-card/70 p-4 sm:grid-cols-2 lg:grid-cols-5">
      <label className="grid gap-1 text-sm">
        <span>Full name</span>
        <input required name="full_name" maxLength={200} className="h-9 rounded-md bg-background px-2 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus:ring-2 focus:ring-primary" />
      </label>
      <label className="grid gap-1 text-sm">
        <span>Email</span>
        <input required type="email" name="email" maxLength={320} className="h-9 rounded-md bg-background px-2 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus:ring-2 focus:ring-primary" />
      </label>
      <label className="grid gap-1 text-sm">
        <span>Organisation role</span>
        <select name="organisation_role" defaultValue="admin" className="h-9 rounded-md bg-background px-2 text-sm outline-none focus:ring-2 focus:ring-primary">
          <option value="owner">owner</option><option value="admin">admin</option><option value="manager">manager</option><option value="staff">staff</option><option value="viewer">viewer</option>
        </select>
      </label>
      <label className="grid gap-1 text-sm">
        <span>Pins Hub access</span>
        <select name="access_level" defaultValue="admin" className="h-9 rounded-md bg-background px-2 text-sm outline-none focus:ring-2 focus:ring-primary">
          <option value="admin">admin</option><option value="write">write</option><option value="read">read</option>
        </select>
      </label>
      <div className="flex items-end">
        <button disabled={pending} type="submit" className="h-9 w-full rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          {pending ? "Sending…" : "Send invite"}
        </button>
      </div>
      {state.message ? <p role="status" className={`sm:col-span-2 lg:col-span-5 text-sm ${state.status === "rate-limit" ? "text-amber-300" : state.status === "success" ? "text-emerald-300" : "text-destructive"}`}>{state.message}</p> : null}
    </form>
  );
}
