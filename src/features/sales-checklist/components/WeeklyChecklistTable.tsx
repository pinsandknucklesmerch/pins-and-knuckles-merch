"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Select } from "@/components/ui/Select";
import { Surface } from "@/components/ui/Surface";
import { feedback } from "@/components/ui/feedback";
import { saveChecklistStatus } from "../actions";
import { checklistScore, isChecklistStatus, weekLabel, type WeeklyChecklist } from "../domain/checklist";

import statusStyles from "./ChecklistStatusControl.module.css";
import { ChecklistStatusControl } from "./ChecklistStatusControl";

export function WeeklyChecklistTable({ checklist }: { checklist: WeeklyChecklist }) {
  const router = useRouter();
  const [navigating, startNavigation] = useTransition();
  const [entries, setEntries] = useState(checklist.entries);
  const [pending, setPending] = useState<Record<string, boolean>>({});
  const saving = useRef(new Set<string>());
  const persisted = useRef(new Map(checklist.entries.map((entry) => [entry.id, entry.status])));

  // Refresh permissions and the weekly period at rollover, also when returning to the tab.
  useEffect(() => {
    const refresh = () => { if (!document.hidden && saving.current.size === 0) router.refresh(); };
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
    if (!isChecklistStatus(value) || !previous || !person?.canEdit || !checklist.isCurrent || navigating || saving.current.has(id) || value === previous) return;
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
      if (saving.current.size === 0) router.refresh();
    }
  }

  return <>
    <div className="flex flex-wrap items-center gap-3">
      <label htmlFor="checklist-week" className="text-sm font-medium">Week</label>
      <div className="w-64"><Select id="checklist-week" value={checklist.weekId} disabled={navigating || Object.values(pending).some(Boolean)} onValueChange={(id) => startNavigation(() => router.push(id === checklist.weeks[0]?.id ? "/hub/sales-checklist" : `/hub/sales-checklist?week=${id}`))}>
        {checklist.weeks.map((week) => <option key={week.id} value={week.id}>{weekLabel(week.startsAt)}</option>)}
      </Select></div>
      <span className="text-sm text-muted-foreground">{navigating ? "Loading…" : checklist.isCurrent ? "Current week · Monday 09:00 rollover" : "Historical week · Read only"}</span>
    </div>
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
                <ChecklistStatusControl status={entry.status} label={`${person.name}: ${duty.name}`} readOnly={!person.canEdit || !checklist.isCurrent || navigating} pending={pending[entry.id]} onChange={(value) => void save(entry.id, value)} />
                {pending[entry.id] ? <span role="status" className="mt-1 block text-xs text-muted-foreground">Saving…</span> : null}
              </div> : <span className="text-muted-foreground">Unavailable</span>}
            </td>;
          })}
        </tr>)}</tbody>
      </table>
      {checklist.duties.length === 0 ? <p className="p-3 text-sm text-muted-foreground">No duties assigned for this week.</p> : null}
    </Surface>
  </>;
}
