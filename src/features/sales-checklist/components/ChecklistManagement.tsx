"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ActionButton } from "@/components/ui/ActionButton";
import { Input } from "@/components/ui/Input";
import { Panel } from "@/components/ui/Panel";
import { SearchableCombobox } from "@/components/ui/SearchableCombobox";
import { feedback } from "@/components/ui/feedback";
import { saveChecklistManagement } from "../actions";
import { weekLabel } from "../domain/checklist";
import { moveChecklistRow, parseManagementInput, type ChecklistManagement as Management } from "../domain/management";

function OrderControls({ index, length, disabled, onMove }: { index: number; length: number; disabled: boolean; onMove: (direction: -1 | 1) => void }) {
  return <div className="flex gap-2">
    <ActionButton disabled={disabled || index === 0} onClick={() => onMove(-1)} className="bg-secondary text-secondary-foreground hover:bg-secondary/80">Move Up</ActionButton>
    <ActionButton disabled={disabled || index === length - 1} onClick={() => onMove(1)} className="bg-secondary text-secondary-foreground hover:bg-secondary/80">Move Down</ActionButton>
  </div>;
}

export function ChecklistManagement({ management }: { management: Management }) {
  const router = useRouter();
  const [duties, setDuties] = useState(() => [...management.duties].sort((a, b) => a.displayOrder - b.displayOrder));
  const [staff, setStaff] = useState(() => [...management.staff].sort((a, b) => a.displayOrder - b.displayOrder));
  const [saving, startSaving] = useTransition();
  const [validationMessage, setValidationMessage] = useState<string | null>(null);
  const [refreshRequired, setRefreshRequired] = useState(false);

  function save() {
    try { parseManagementInput({ revision: management.revision, effectiveFrom: management.effectiveFrom, duties, staff }); }
    catch (error) { setValidationMessage(error instanceof Error ? error.message : "Check the highlighted configuration."); return; }
    setValidationMessage(null);
    startSaving(async () => {
      try {
        const result = await saveChecklistManagement({ revision: management.revision, effectiveFrom: management.effectiveFrom, duties, staff });
        (result.ok ? feedback.success : feedback.error)(result.message);
        if (result.refreshRequired) setRefreshRequired(true);
        if (result.ok) router.refresh();
      } catch { feedback.error("Checklist configuration could not be saved. Please try again."); }
    });
  }

  return <>
    <p className="text-sm text-muted-foreground">Changes apply to {weekLabel(management.effectiveFrom).toLowerCase()}, Monday 09:00. Saved weekly snapshots remain unchanged.</p>
    <Panel title="Duties">
      <div className="grid gap-3">
        {duties.map((duty, index) => <div key={duty.id} className="flex flex-wrap items-center gap-3 border-b border-border/70 pb-3">
          <div className="min-w-48 flex-1"><Input aria-label={`Duty ${index + 1} name`} aria-invalid={Boolean(validationMessage && !duty.name.trim())} aria-describedby={validationMessage ? "checklist-validation" : undefined} value={duty.name} maxLength={120} disabled={saving} onChange={(event) => setDuties((rows) => rows.map((row) => row.id === duty.id ? { ...row, name: event.target.value } : row))} /></div>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={duty.isActive} disabled={saving} onChange={(event) => setDuties((rows) => rows.map((row) => row.id === duty.id ? { ...row, isActive: event.target.checked } : row))} />Active</label>
          <OrderControls index={index} length={duties.length} disabled={saving} onMove={(direction) => setDuties((rows) => moveChecklistRow(rows, index, direction))} />
          {!management.duties.some((row) => row.id === duty.id) ? <ActionButton disabled={saving} onClick={() => setDuties((rows) => rows.filter((row) => row.id !== duty.id))} className="bg-secondary text-secondary-foreground hover:bg-secondary/80">Remove Draft</ActionButton> : null}
        </div>)}
        <div><ActionButton disabled={saving || duties.length >= 100} onClick={() => setDuties((rows) => [...rows, { id: crypto.randomUUID(), name: "", displayOrder: Math.max(-1, ...rows.map((row) => row.displayOrder)) + 1, isActive: true }])}>Add Duty</ActionButton></div>
      </div>
    </Panel>
    <Panel title="Sales team">
      <div className="grid gap-3">
        {staff.map((person, index) => {
          const selected = management.users.find((user) => user.id === person.memberId);
          return <div key={person.id} className="flex flex-wrap items-center gap-3 border-b border-border/70 pb-3">
            <div className="min-w-60 flex-1"><SearchableCombobox items={management.users} value={selected ? selected.name : person.memberId ? `${person.name} · Access unavailable` : ""} selectedKey={person.memberId}
              getKey={(user) => user.id} getSearchText={(user) => `${user.name} ${user.email ?? ""}`} renderOption={(user) => <>{user.name}{user.email ? <span className="ml-2 text-muted-foreground">{user.email}</span> : null}</>}
              onSelect={(user) => setStaff((rows) => rows.map((row) => row.id === person.id ? { ...row, memberId: user.id, name: user.name } : row))}
              onClear={() => setStaff((rows) => rows.map((row) => row.id === person.id ? { ...row, memberId: null } : row))}
              allowManualEntry={false} ariaLabel={`Sales team assignment ${index + 1}`} placeholder={`Select user${person.name ? ` for ${person.name}` : ""}`} emptyMessage="No eligible organisation users" disabled={saving} /></div>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={person.isActive} disabled={saving} onChange={(event) => setStaff((rows) => rows.map((row) => row.id === person.id ? { ...row, isActive: event.target.checked } : row))} />Active</label>
            <OrderControls index={index} length={staff.length} disabled={saving} onMove={(direction) => setStaff((rows) => moveChecklistRow(rows, index, direction))} />
            {!management.staff.some((row) => row.id === person.id) ? <ActionButton disabled={saving} onClick={() => setStaff((rows) => rows.filter((row) => row.id !== person.id))} className="bg-secondary text-secondary-foreground hover:bg-secondary/80">Remove Draft</ActionButton> : null}
          </div>;
        })}
        <div><ActionButton disabled={saving || staff.length >= 100} onClick={() => setStaff((rows) => [...rows, { id: crypto.randomUUID(), name: "", memberId: null, displayOrder: Math.max(-1, ...rows.map((row) => row.displayOrder)) + 1, isActive: true }])}>Add Team Member</ActionButton></div>
      </div>
    </Panel>
    {validationMessage ? <p id="checklist-validation" role="alert" className="text-sm text-destructive">{validationMessage}</p> : null}
    <div className="flex flex-wrap gap-2"><ActionButton disabled={saving || refreshRequired} onClick={save}>{saving ? "Saving…" : "Save Configuration"}</ActionButton>{refreshRequired ? <ActionButton disabled={saving} onClick={() => startSaving(() => router.refresh())}>Refresh Configuration</ActionButton> : null}<ActionButton href="/hub/sales-checklist" className="bg-secondary text-secondary-foreground hover:bg-secondary/80">Back to Checklist</ActionButton></div>
  </>;
}
