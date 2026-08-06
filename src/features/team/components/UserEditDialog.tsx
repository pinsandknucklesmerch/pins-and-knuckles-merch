"use client";

import { useActionState, useCallback, useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { feedback, isInlineValidation } from "@/components/ui/feedback";
import { mondayIdentities } from "@/features/sales-dashboard/domain/memberIdentity";
import { updateUser } from "../actions/users";
import type { TeamMember } from "../data/teamMembers";
import { initialUserAccessActionState } from "../types";

export function UserEditDialog({ member, currentUserId, onClose }: { member: TeamMember; currentUserId?: string; onClose: () => void }) {
  const [state, action, pending] = useActionState(updateUser, initialUserAccessActionState);
  const [dialog, setDialog] = useState<HTMLDialogElement | null>(null);
  const handledStateRef = useRef(initialUserAccessActionState);
  const dialogRef = useCallback((node: HTMLDialogElement | null) => setDialog(node), []);
  useEffect(() => { if (dialog && !dialog.open) dialog.showModal(); }, [dialog]);
  useEffect(() => {
    if (state === handledStateRef.current) return;
    handledStateRef.current = state;
    if (state.status === "success") { feedback.success(state.message ?? "User updated."); dialog?.close(); onClose(); }
    else if (state.status === "error" && state.message && !isInlineValidation(state.message)) feedback.error(state.message);
  }, [dialog, onClose, state]);

  const self = member.userId === currentUserId;
  const protectedUser = member.isOwner;
  const fullNameError = state.status === "error" && state.message?.startsWith("Full name") ? state.message : null;

  return <dialog ref={dialogRef} onCancel={onClose} className="fixed inset-0 z-[60] m-auto w-[calc(100vw-2rem)] max-w-lg overflow-visible rounded-lg border border-border bg-card p-0 text-foreground shadow-lg backdrop:bg-black/70">
    <form action={action} className="grid max-h-[calc(100dvh-2rem)] gap-4 overflow-y-auto p-5"><div className="flex items-center justify-between"><h2 className="text-base font-semibold">Edit user</h2><button type="button" onClick={() => { dialog?.close(); onClose(); }} className="text-muted-foreground hover:text-foreground" aria-label="Close edit user dialog">×</button></div>
      <input type="hidden" name="membership_id" value={member.id} />
      <label className="grid gap-1 text-sm"><span>Full name</span><Input required name="full_name" defaultValue={member.fullName ?? ""} maxLength={200} aria-invalid={Boolean(fullNameError)} aria-describedby={fullNameError ? "user-full-name-error" : undefined} />{fullNameError ? <span id="user-full-name-error" role="alert" className="text-sm text-destructive">{fullNameError}</span> : null}</label>
      <label className="grid gap-1 text-sm"><span>Email</span><Input readOnly value={member.email ?? "—"} className="bg-muted text-muted-foreground" /></label>
      <div className="grid gap-3 sm:grid-cols-2"><label className="grid gap-1 text-sm"><span>Organisation role</span><Select name="organisation_role" defaultValue={protectedUser ? "owner" : member.role.toLowerCase()} disabled={protectedUser || self} portalContainer={dialog}><option value="owner" disabled>Owner</option><option value="admin">Admin</option><option value="manager">Manager</option><option value="staff">Staff</option><option value="viewer">Viewer</option></Select>{protectedUser || self ? <input type="hidden" name="organisation_role" value={member.role.toLowerCase()} /> : null}</label><label className="grid gap-1 text-sm"><span>Pins Hub access</span><Select name="access_level" defaultValue={(member.accessLevel ?? "read").toLowerCase()} disabled={protectedUser || self} portalContainer={dialog}><option value="admin">Admin</option><option value="write">Write</option><option value="read">Read</option></Select>{protectedUser || self ? <input type="hidden" name="access_level" value={(member.accessLevel ?? "read").toLowerCase()} /> : null}</label></div>
      <label className="grid gap-1 text-sm"><span>Monday account</span><Select name="monday_member_id" defaultValue={member.mondayMemberId ?? "none"} portalContainer={dialog}><option value="none">Not linked</option>{mondayIdentities().map((person) => <option key={person.id} value={person.id}>{person.displayName}</option>)}</Select></label>
      <label className="flex items-center gap-2 text-sm"><input type="hidden" name="is_active" value={protectedUser || self ? String(member.status !== "Inactive") : "false"} /><input type="checkbox" name="is_active" value="true" defaultChecked={member.status !== "Inactive"} disabled={protectedUser || self} /> Active access</label>
      {protectedUser ? <p className="text-sm text-muted-foreground">Owner access is protected.</p> : self ? <p className="text-sm text-muted-foreground">Your administrator access and active status are protected.</p> : null}
      {state.status === "error" && state.message && isInlineValidation(state.message) && !fullNameError ? <p role="alert" className="text-sm text-destructive">{state.message}</p> : null}<div className="flex justify-end gap-2"><button type="button" onClick={() => { dialog?.close(); onClose(); }} className="h-9 rounded-md border border-border px-3 text-sm">Cancel</button><button type="submit" disabled={pending} className="h-9 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground disabled:opacity-60">{pending ? "Saving…" : "Save changes"}</button></div>
    </form>
  </dialog>;
}
