"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { feedback } from "@/components/ui/feedback";
import { initialDataManagementActionState, type DataManagementActionState } from "../types";

type LifecycleAction = (state: DataManagementActionState, formData: FormData) => Promise<DataManagementActionState>;

export function InvoiceDirectoryLifecycleDialog({
  id,
  label,
  active,
  action,
  mode = "status",
}: {
  id: string;
  label: string;
  active?: boolean;
  action: LifecycleAction;
  mode?: "status" | "delete";
}) {
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState(action, initialDataManagementActionState);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open) dialogRef.current?.showModal();
  }, [open]);

  useEffect(() => {
    if (!state.message) return;
    if (state.ok) {
      feedback.success(state.message);
      dialogRef.current?.close();
    } else if (!state.fieldErrors) {
      feedback.error(state.message);
    }
  }, [state]);

  const isDelete = mode === "delete";
  const actionLabel = isDelete ? "Delete" : active ? "Deactivate" : "Reactivate";
  const title = isDelete ? `Delete ${label}` : `${active ? "Deactivate" : "Reactivate"} ${label}`;

  return <>
    <button ref={triggerRef} type="button" onClick={() => setOpen(true)} className={isDelete ? "text-destructive hover:underline" : active ? "text-destructive hover:underline" : "text-primary hover:underline"}>{actionLabel}</button>
    {open ? <dialog ref={dialogRef} onClose={() => { setOpen(false); triggerRef.current?.focus(); }} aria-labelledby={`${id}-${mode}-title`} className="w-full max-w-md rounded-lg border border-border bg-card p-0 text-foreground shadow-lg backdrop:bg-black/65">
      <form action={formAction} className="grid gap-4 p-4">
        <input hidden name="id" value={id} readOnly />
        {!isDelete ? <input hidden name="isActive" value={String(!active)} readOnly /> : null}
        <div className="grid gap-2">
          <h2 id={`${id}-${mode}-title`} className="text-base font-semibold">{title}?</h2>
          <p className="text-sm text-muted-foreground">{isDelete ? "This record will be permanently removed." : active ? "This record will no longer appear in invoice selectors." : "This record will become available in invoice selectors again."}</p>
        </div>
        {state.message && !state.ok && state.fieldErrors ? <p role="alert" className="text-sm text-destructive">{state.message}</p> : null}
        <div className="flex justify-end gap-2">
          <button type="button" onClick={() => dialogRef.current?.close()} className="h-9 rounded-md border border-input px-3 text-sm hover:bg-accent">Cancel</button>
          <button type="submit" disabled={pending} className={`h-9 rounded-md px-3 text-sm font-medium disabled:opacity-50 ${isDelete || active ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : "bg-primary text-primary-foreground hover:bg-primary/90"}`}>{pending ? `${isDelete ? "Deleting" : active ? "Deactivating" : "Reactivating"}…` : actionLabel}</button>
        </div>
      </form>
    </dialog> : null}
  </>;
}
