"use client";

import { useActionState, useCallback, useEffect, useState } from "react";
import { Dialog } from "@/components/ui/Dialog";
import { feedback } from "@/components/ui/feedback";
import { initialDataManagementActionState, type DataManagementActionState } from "../types";

type LifecycleAction = (state: DataManagementActionState, formData: FormData) => Promise<DataManagementActionState>;

export function InvoiceDirectoryLifecycleDialog({
  id,
  label,
  active,
  action,
  mode = "status",
  open: controlledOpen,
  onOpenChange,
  hideTrigger = false,
}: {
  id: string;
  label: string;
  active?: boolean;
  action: LifecycleAction;
  mode?: "status" | "delete";
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  hideTrigger?: boolean;
}) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const [state, formAction, pending] = useActionState(action, initialDataManagementActionState);
  const open = controlledOpen ?? uncontrolledOpen;
  const setOpen = useCallback((nextOpen: boolean) => {
    if (controlledOpen === undefined) setUncontrolledOpen(nextOpen);
    onOpenChange?.(nextOpen);
  }, [controlledOpen, onOpenChange]);

  useEffect(() => {
    if (!state.message) return;
    if (state.ok) {
      feedback.success(state.message);
      setOpen(false);
    } else if (!state.fieldErrors) {
      feedback.error(state.message);
    }
  }, [setOpen, state]);

  const isDelete = mode === "delete";
  const actionLabel = isDelete ? "Delete" : active ? "Deactivate" : "Reactivate";
  const title = isDelete ? `Delete ${label}` : `${active ? "Deactivate" : "Reactivate"} ${label}`;

  return <>
    {!hideTrigger ? <button type="button" onClick={() => setOpen(true)} className={isDelete ? "inline-flex min-h-8 items-center rounded-md px-2 text-destructive hover:bg-destructive/10 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" : active ? "inline-flex min-h-8 items-center rounded-md px-2 text-destructive hover:bg-destructive/10 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" : "inline-flex min-h-8 items-center rounded-md px-2 text-primary hover:bg-primary/10 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"}>{actionLabel}</button> : null}
    <Dialog open={open} onClose={() => setOpen(false)} title={title} description={isDelete ? "This record will be permanently removed." : active ? "This record will no longer appear in invoice selectors." : "This record will become available in invoice selectors again."} className="max-w-md">
      <form action={formAction} className="grid gap-4">
        <input hidden name="id" value={id} readOnly />
        {!isDelete ? <input hidden name="isActive" value={String(!active)} readOnly /> : null}
        {state.message && !state.ok && state.fieldErrors ? <p role="alert" className="text-sm text-destructive">{state.message}</p> : null}
        <div className="flex justify-end gap-2">
          <button type="button" onClick={() => setOpen(false)} className="h-9 rounded-md border border-input px-3 text-sm hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Cancel</button>
          <button type="submit" disabled={pending} className={`h-9 rounded-md px-3 text-sm font-medium disabled:opacity-50 ${isDelete || active ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : "bg-primary text-primary-foreground hover:bg-primary/90"}`}>{pending ? `${isDelete ? "Deleting" : active ? "Deactivating" : "Reactivating"}…` : actionLabel}</button>
        </div>
      </form>
    </Dialog>
  </>;
}
