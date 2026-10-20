"use client";

import { useEffect, useRef, useState } from "react";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import { LoadingState } from "@/components/ui/LoadingState";
import { readChecklistForTv } from "../actions";
import { checklistScore, weekLabel, type ChecklistStatus, type WeeklyChecklist } from "../domain/checklist";
import styles from "./SalesChecklistTvSlide.module.css";
import { checklistTvLayoutKey, checklistTvPagePlan, TV_DUTIES_PER_PAGE, TV_STAFF_PER_PAGE } from "../domain/tvPagination";

import { ChecklistStatusControl } from "./ChecklistStatusControl";
const REFRESH_INTERVAL_MS = 15_000;
type PlaybackProps = { durationSeconds: number; paused: boolean; onPlaybackComplete: (complete: boolean) => void };

export function SalesChecklistTvSlide({ durationSeconds, paused, onPlaybackComplete }: PlaybackProps) {
  const [checklist, setChecklist] = useState<WeeklyChecklist | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const layoutRef = useRef<string | null>(null);

  useEffect(() => {
    let disposed = false;
    let fetching = false;
    async function refresh() {
      if (document.hidden || fetching) return;
      fetching = true;
      try {
        const result = await readChecklistForTv();
        if (!disposed) {
          const layout = result.checklist ? checklistTvLayoutKey(result.checklist) : null;
          if (layout !== layoutRef.current) {
            onPlaybackComplete(false);
            layoutRef.current = layout;
          }
          // Error/empty states use the normal rotation timeout, rather than blocking TV forever.
          if (result.errorMessage || !result.checklist || !result.checklist.staff.length) onPlaybackComplete(true);
          // Do not retain a previous user's data after access is revoked or setup fails.
          setChecklist(result.checklist);
          setErrorMessage(result.errorMessage);
        }
      } catch { if (!disposed) { layoutRef.current = null; onPlaybackComplete(true); setChecklist(null); setErrorMessage("The checklist could not be refreshed."); } }
      finally { fetching = false; if (!disposed) setLoading(false); }
    }
    void refresh();
    const timer = window.setInterval(() => void refresh(), REFRESH_INTERVAL_MS);
    const onVisible = () => { if (!document.hidden) void refresh(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => { disposed = true; window.clearInterval(timer); document.removeEventListener("visibilitychange", onVisible); };
  }, [onPlaybackComplete]);

  if (loading) return <LoadingState label="Loading weekly checklist" />;
  if (errorMessage || !checklist) return <ErrorState title="Checklist unavailable" message={errorMessage ?? "The checklist could not be loaded."} />;
  if (!checklist.staff.length) return <EmptyState title="No checklist team assigned" />;
  return <ChecklistPages key={checklistTvLayoutKey(checklist)} checklist={checklist} durationSeconds={durationSeconds} paused={paused} onPlaybackComplete={onPlaybackComplete} />;
}

function ChecklistPages({ checklist, durationSeconds, paused, onPlaybackComplete }: PlaybackProps & { checklist: WeeklyChecklist }) {
  const [page, setPage] = useState(0);
  const [complete, setComplete] = useState(false);
  const { dutyPages, pageCount, pageDurationMs } = checklistTvPagePlan(checklist, durationSeconds);

  useEffect(() => { onPlaybackComplete(false); }, [onPlaybackComplete]);
  useEffect(() => {
    if (paused || complete) return;
    const timer = window.setTimeout(() => {
      if (page + 1 < pageCount) setPage(page + 1);
      else { setComplete(true); onPlaybackComplete(true); }
    }, pageDurationMs);
    return () => window.clearTimeout(timer);
  }, [complete, onPlaybackComplete, page, pageCount, pageDurationMs, paused]);

  const staffOffset = Math.floor(page / dutyPages) * TV_STAFF_PER_PAGE;
  const dutyOffset = page % dutyPages * TV_DUTIES_PER_PAGE;
  const staff = checklist.staff.slice(staffOffset, staffOffset + TV_STAFF_PER_PAGE);
  const duties = checklist.duties.slice(dutyOffset, dutyOffset + TV_DUTIES_PER_PAGE);

  return <section className={styles.slide} data-tv-view="sales_checklist">
    <div className={styles.heading} data-tv-group="checklist-heading">
      <h2>Sales Weekly Checklist</h2>
      <span>{weekLabel(checklist.startsAt)}{pageCount > 1 ? ` · Page ${page + 1}/${pageCount}` : ""}</span>
    </div>
    <table className={styles.table}>
      <caption className="sr-only">Read-only weekly sales checklist and completion scores</caption>
      <thead><tr><th scope="col">Duty</th>{staff.map((person) => {
        // Score covers the full week, including duties on other pages.
        const score = checklistScore(checklist.entries.filter((entry) => entry.staffId === person.id).map((entry) => entry.status));
        return <th scope="col" key={person.id}><div className={styles.name} title={person.name}>{person.name}</div><strong className={styles.score}>{score.percentage === null ? "N/A" : `${score.percentage}%`}</strong><span className={styles.progressLabel}>{score.applicable === 0 ? "No applicable tasks" : `${score.complete}/${score.applicable} completed`}</span>{score.applicable > 0 ? <progress aria-label={`${person.name} completion`} max={score.applicable} value={score.complete} className={styles.progress} /> : null}</th>;
      })}</tr></thead>
      <tbody>{duties.map((duty) => <tr key={duty.id}><th scope="row"><span className={styles.dutyName} title={duty.name}>{duty.name}</span></th>{staff.map((person) => {
        const entry = checklist.entries.find((item) => item.dutyId === duty.id && item.staffId === person.id);
        const status: ChecklistStatus | undefined = entry?.status;
        return <td key={person.id}>{status ? <ChecklistStatusControl status={status} label={`${person.name}: ${duty.name}`} readOnly /> : <span className="text-muted-foreground">Unavailable</span>}</td>;
      })}</tr>)}</tbody>
    </table>
    {!duties.length ? <p className={styles.progressLabel}>No duties assigned for this week.</p> : null}
  </section>;
}
