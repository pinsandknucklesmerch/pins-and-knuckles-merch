"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ActionButton } from "@/components/ui/ActionButton";
import { Dialog } from "@/components/ui/Dialog";
import { Surface } from "@/components/ui/Surface";
import { feedback } from "@/components/ui/feedback";
import { clearChecklist, saveChecklistStatus } from "../actions";
import { checklistScore, isChecklistStatus, type SalesChecklist } from "../domain/checklist";

import statusStyles from "./ChecklistStatusControl.module.css";
import { ChecklistStatusControl } from "./ChecklistStatusControl";

export function WeeklyChecklistTable({ checklist }: { checklist: SalesChecklist }) {
  const router = useRouter();
  const [refreshing, startRefresh] = useTransition();
  const [confirmClear, setConfirmClear] = useState(false);
  const [resetting, setResetting] = useState(false);
  const resetInProgress = useRef(false);
  const [entries, setEntries] = useState(checklist.entries);
  const [pending, setPending] = useState<Record<string, boolean>>({});
  const saving = useRef(new Set<string>());
  const persisted = useRef(new Map(checklist.entries.map((entry) => [entry.id, entry.status])));

  // Refresh permissions and remote status changes, including the scheduled Monday reset.
  useEffect(() => {
    const refresh = () => { if (!document.hidden && !resetInProgress.current && saving.current.size === 0) router.refresh(); };
    const timer = window.setInterval(refresh, 60_000);
    document.addEventListener("visibilitychange", refresh);
    return () => { window.clearInterval(timer); document.removeEventListener("visibilitychange", refresh); };
  }, [router]);
  useEffect(() => {
    const confirmed = new Map(checklist.entries.map((entry) => [entry.id, entry.status]));
    for (const id of saving.current) {
      const previous = persisted.current.get(id);
      if (previous && confirmed.has(id)) confirmed.set(id, previous);
    }
    persisted.current = confirmed;
    setEntries((current) => checklist.entries.map((entry) => saving.current.has(entry.id) ? current.find((row) => row.id === entry.id) ?? entry : entry));
  }, [checklist.entries]);

  async function save(id: string, value: string) {
    const entry = checklist.entries.find((row) => row.id === id);
    const person = checklist.staff.find((staff) => staff.id === entry?.staffId);
    const previous = persisted.current.get(id);
    if (!isChecklistStatus(value) || !previous || !person?.canEdit || resetInProgress.current || confirmClear || refreshing || saving.current.has(id) || value === previous) return;
    saving.current.add(id);
    setEntries((current) => current.map((row) => row.id === id ? { ...row, status: value } : row));
    setPending((current) => ({ ...current, [id]: true }));
    try {
      const result = await saveChecklistStatus(id, value);
      if (result.ok) {
        persisted.current.set(id, value);
        setEntries((current) => current.map((entry) => entry.id === id ? { ...entry, status: value } : entry));
        feedback.success(result.message);
      } else {
        setEntries((current) => current.map((entry) => entry.id === id ? { ...entry, status: persisted.current.get(id) ?? previous } : entry));
        feedback.error(result.message);
      }
    } catch {
      setEntries((current) => current.map((entry) => entry.id === id ? { ...entry, status: persisted.current.get(id) ?? previous } : entry));
      feedback.error("Status could not be saved. Please try again.");
    }
    finally {
      saving.current.delete(id);
      setPending((current) => ({ ...current, [id]: false }));
      if (!resetInProgress.current && saving.current.size === 0) router.refresh();
    }
  }

  async function clearAll() {
    if (!checklist.canClear || resetInProgress.current || saving.current.size > 0 || refreshing) return;
    resetInProgress.current = true;
    setResetting(true);
    try {
      const result = await clearChecklist();
      if (result.ok) {
        const cleared = entries.map((entry) => ({ ...entry, status: "to_do" as const }));
        persisted.current = new Map(cleared.map((entry) => [entry.id, entry.status]));
        setEntries(cleared);
        feedback.success(result.message);
        setConfirmClear(false);
        resetInProgress.current = false;
        setResetting(false);
        startRefresh(() => router.refresh());
      } else {
        resetInProgress.current = false;
        setResetting(false);
        feedback.error(result.message);
        startRefresh(() => router.refresh());
      }
    } catch {
      resetInProgress.current = false;
      setResetting(false);
      feedback.error("The checklist could not be cleared. Please try again.");
      startRefresh(() => router.refresh());
    }
  }

  return <>
    <div className="flex flex-wrap items-center gap-3">
      <span className="text-sm text-muted-foreground">Resets Monday at 09:00</span>
      {checklist.canClear ? <ActionButton className="border border-destructive/60 bg-transparent text-destructive hover:bg-destructive/10" disabled={resetting || refreshing || Object.values(pending).some(Boolean)} onClick={() => setConfirmClear(true)}>Clear All</ActionButton> : null}
    </div>
    <Dialog open={confirmClear} onClose={() => { if (!resetInProgress.current) setConfirmClear(false); }} title="Clear all task statuses?" description="All team members’ tasks will be reset to To Do. This cannot be undone." className="max-w-md">
      <div className="flex justify-end gap-2">
        <ActionButton disabled={resetting} className="bg-secondary text-secondary-foreground hover:bg-secondary/80" onClick={() => setConfirmClear(false)}>Cancel</ActionButton>
        <ActionButton className="bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={resetting || refreshing || Object.values(pending).some(Boolean)} onClick={() => void clearAll()}>{resetting ? "Clearing…" : "Clear All"}</ActionButton>
      </div>
    </Dialog>
    <Surface variant="collapsible" className="overflow-x-auto">
      <table className="w-full table-fixed text-sm" style={{ minWidth: 208 + checklist.staff.length * 160 }}>
        <colgroup><col style={{ width: 208 }} />{checklist.staff.map((person) => <col key={person.id} style={{ width: 160 }} />)}</colgroup>
        <caption className="sr-only">Weekly sales duties, status and progress for each staff member</caption>
        <thead><tr className="border-b border-border">
          <th scope="col" className="sticky left-0 z-10 w-48 bg-card p-3 text-left align-bottom">Duty</th>
          {checklist.staff.map((person) => {
            const score = checklistScore(entries.filter((entry) => entry.staffId === person.id).map((entry) => entry.status));
            return <th scope="col" key={person.id} className="p-3 text-center align-bottom font-normal">
              <div className="break-words font-semibold">{person.name}</div>
              <div className="mt-1 text-xs text-muted-foreground">{score.percentage === null ? "N/A · No applicable tasks" : `${score.percentage}% · ${score.complete}/${score.applicable} completed`}</div>
              {score.percentage !== null ? <progress aria-label={`${person.name} completion`} value={score.complete} max={score.applicable} className={`mt-2 h-1.5 w-full ${statusStyles.progress}`} /> : null}
            </th>;
          })}
        </tr></thead>
        <tbody>{checklist.duties.map((duty) => <tr key={duty.id} className="border-b border-border/70 last:border-0">
          <th scope="row" className="sticky left-0 z-10 bg-card p-3 text-left font-medium">{duty.name}</th>
          {checklist.staff.map((person) => {
            const entry = entries.find((item) => item.dutyId === duty.id && item.staffId === person.id);
            return <td key={person.id} className="px-2 py-3 text-center align-middle">
              {entry ? <div aria-busy={pending[entry.id] || false}>
                <ChecklistStatusControl status={entry.status} label={`${person.name}: ${duty.name}`} readOnly={!person.canEdit || resetting || confirmClear || refreshing} pending={pending[entry.id]} onChange={(value) => void save(entry.id, value)} />
                {pending[entry.id] ? <span role="status" className="mt-1 block text-xs text-muted-foreground">Saving…</span> : null}
              </div> : <span className="text-muted-foreground">Unavailable</span>}
            </td>;
          })}
        </tr>)}</tbody>
      </table>
      {checklist.duties.length === 0 ? <p className="p-3 text-sm text-muted-foreground">No active duties assigned.</p> : null}
    </Surface>
  </>;
}
