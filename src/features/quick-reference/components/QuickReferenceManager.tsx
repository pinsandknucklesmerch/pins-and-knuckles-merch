"use client";

import { useActionState, useEffect, useState } from "react";
import { ActionButton } from "@/components/ui/ActionButton";
import { ActionMenu } from "@/components/ui/ActionMenu";
import { Dialog } from "@/components/ui/Dialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { FormField } from "@/components/ui/FormField";
import { Input, NumberInput, Textarea } from "@/components/ui/Input";
import { Surface } from "@/components/ui/Surface";
import { feedback } from "@/components/ui/feedback";
import { canManagePinsHub } from "@/lib/access/pinsHubRoles";
import {
  createQuickReferenceAction,
  deleteQuickReferenceAction,
  setQuickReferenceActiveAction,
  updateQuickReferenceAction,
} from "../actions";
import {
  initialQuickReferenceActionState,
  type QuickReferenceActionState,
  type QuickReferenceRecord,
} from "../types";

type LifecycleMode = "status" | "delete" | null;
type LifecycleAction = (state: QuickReferenceActionState, formData: FormData) => Promise<QuickReferenceActionState>;

export function QuickReferenceManager({ records, accessLevel }: { records: QuickReferenceRecord[]; accessLevel: string | null }) {
  const [selected, setSelected] = useState<QuickReferenceRecord | null | "new">(null);
  const canAdmin = canManagePinsHub(accessLevel);

  return <div className="space-y-4">
    <div className="flex justify-end">
      <ActionButton onClick={() => setSelected("new")}>Add Quick Reference</ActionButton>
    </div>
    {selected ? <QuickReferenceForm record={selected === "new" ? null : selected} onClose={() => setSelected(null)} /> : null}
    {records.length ? <Surface className="overflow-x-auto bg-card/70 p-0">
      <table className="min-w-[720px] text-left text-sm">
        <thead className="bg-secondary/60 text-xs text-muted-foreground"><tr><th className="px-4 py-3">Manage</th><th className="px-4 py-3">Title</th><th className="px-4 py-3">Category</th><th className="px-4 py-3">Status</th><th className="px-4 py-3 text-right">Display order</th></tr></thead>
        <tbody>{records.map((record) => <tr key={record.id} className="border-t border-border/70">
          <td className="px-4 py-3"><QuickReferenceManageMenu record={record} canAdmin={canAdmin} onEdit={() => setSelected(record)} /></td>
          <td className="max-w-80 truncate px-4 py-3 font-medium">{record.title}</td>
          <td className="px-4 py-3">{record.category}</td>
          <td className="px-4 py-3"><span className={record.isActive ? "text-emerald-400" : "text-muted-foreground"}>{record.isActive ? "Active" : "Inactive"}</span></td>
          <td className="px-4 py-3 text-right tabular-nums">{record.displayOrder}</td>
        </tr>)}</tbody>
      </table>
    </Surface> : <EmptyState title="No Quick Reference records." />}
  </div>;
}

function QuickReferenceManageMenu({ record, canAdmin, onEdit }: { record: QuickReferenceRecord; canAdmin: boolean; onEdit: () => void }) {
  const [lifecycleMode, setLifecycleMode] = useState<LifecycleMode>(null);
  const closeLifecycleDialog = (open: boolean) => { if (!open) setLifecycleMode(null); };

  return <>
    <ActionMenu label="Manage" items={[
      { label: "Edit", onSelect: onEdit },
      ...(canAdmin ? [{ label: record.isActive ? "Deactivate" : "Reactivate", onSelect: () => setLifecycleMode("status"), destructive: record.isActive }] : []),
      ...(canAdmin ? [{ label: "Delete", onSelect: () => setLifecycleMode("delete"), destructive: true }] : []),
    ]} />
    <QuickReferenceLifecycleDialog id={record.id} active={record.isActive} action={setQuickReferenceActiveAction} open={lifecycleMode === "status"} onOpenChange={closeLifecycleDialog} />
    <QuickReferenceLifecycleDialog id={record.id} mode="delete" action={deleteQuickReferenceAction} open={lifecycleMode === "delete"} onOpenChange={closeLifecycleDialog} />
  </>;
}

function QuickReferenceLifecycleDialog({
  id,
  active = false,
  action,
  mode = "status",
  open,
  onOpenChange,
}: {
  id: string;
  active?: boolean;
  action: LifecycleAction;
  mode?: Exclude<LifecycleMode, null>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [state, formAction, pending] = useActionState(action, initialQuickReferenceActionState);
  const isDelete = mode === "delete";
  const actionLabel = isDelete ? "Delete" : active ? "Deactivate" : "Reactivate";

  useEffect(() => {
    if (!state.message) return;
    if (state.ok) {
      feedback.success(state.message);
      onOpenChange(false);
    } else if (!state.fieldErrors) {
      feedback.error(state.message);
    }
  }, [onOpenChange, state]);

  return <Dialog open={open} onClose={() => onOpenChange(false)} title={`${actionLabel} Quick Reference record`} description={isDelete ? "This record will be permanently removed." : active ? "This record will no longer appear in Quick Reference." : "This record will appear in Quick Reference again."} className="max-w-md">
    <form action={formAction} className="grid gap-4">
      <input hidden name="id" value={id} readOnly />
      {!isDelete ? <input hidden name="isActive" value={String(!active)} readOnly /> : null}
      <div className="flex justify-end gap-2">
        <button type="button" onClick={() => onOpenChange(false)} className="h-9 rounded-md border border-input px-3 text-sm hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Cancel</button>
        <button type="submit" disabled={pending} className={`h-9 rounded-md px-3 text-sm font-medium disabled:opacity-50 ${isDelete || active ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : "bg-primary text-primary-foreground hover:bg-primary/90"}`}>{pending ? `${actionLabel === "Delete" ? "Deleting" : actionLabel === "Deactivate" ? "Deactivating" : "Reactivating"}…` : actionLabel}</button>
      </div>
    </form>
  </Dialog>;
}

function QuickReferenceForm({ record, onClose }: { record: QuickReferenceRecord | null; onClose: () => void }) {
  const action = record ? updateQuickReferenceAction : createQuickReferenceAction;
  const [state, formAction, pending] = useActionState(action, initialQuickReferenceActionState);

  useEffect(() => {
    if (!state.message) return;
    if (state.ok) {
      feedback.success(state.message);
      onClose();
    } else if (!state.fieldErrors) {
      feedback.error(state.message);
    }
  }, [onClose, state]);

  return <Surface className="min-w-0 bg-card/80">
    <form action={formAction} className="grid min-w-0 gap-3 sm:grid-cols-2">
      <input hidden name="id" value={record?.id ?? ""} readOnly />
      <FormField label="Title" error={state.fieldErrors?.title}><Input required name="title" defaultValue={record?.title ?? ""} /></FormField>
      <FormField label="Category" error={state.fieldErrors?.category}><Input required name="category" defaultValue={record?.category ?? ""} /></FormField>
      <FormField label="Display order" error={state.fieldErrors?.displayOrder}><NumberInput required name="displayOrder" min="0" step="1" inputMode="numeric" defaultValue={record?.displayOrder ?? 0} /></FormField>
      <div className="hidden sm:block" aria-hidden="true" />
      <FormField label="Body" error={state.fieldErrors?.body} className="sm:col-span-2"><Textarea required name="body" rows={6} defaultValue={record?.body ?? ""} /></FormField>
      <FormField label="Warning" className="sm:col-span-2"><Textarea name="warning" rows={3} defaultValue={record?.warning ?? ""} /></FormField>
      {state.message && !state.ok && state.fieldErrors ? <p role="alert" className="text-sm text-destructive sm:col-span-2">{state.message}</p> : null}
      <div className="flex gap-2 sm:col-span-2">
        <ActionButton type="submit" disabled={pending}>{pending ? "Saving…" : record ? "Save Quick Reference" : "Add Quick Reference"}</ActionButton>
        <button type="button" onClick={onClose} className="h-9 rounded-md border border-input px-3 text-sm hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Cancel</button>
      </div>
    </form>
  </Surface>;
}
