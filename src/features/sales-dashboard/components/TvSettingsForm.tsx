"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import { ActionButton } from "@/components/ui/ActionButton";
import { Input } from "@/components/ui/Input";
import { Panel } from "@/components/ui/Panel";
import { feedback } from "@/components/ui/feedback";
import { resetSalesDashboardTvSettings, saveSalesDashboardTvSettings } from "../actions";
import { TV_SLIDE_KEYS, type TvSettingsActionState, type TvSlideKey, type TvSlideSetting } from "../lib/tvSettings";

const LABELS: Record<TvSlideKey, string> = { overview: "Overview", ytd: "YTD", year_comparison: "Year Comparison", snuggle: "Snuggle", team_members: "Team Members", "live-zoo-cam": "Live Zoo Cam" };
const initialState: TvSettingsActionState = { ok: false, message: "" };

export function TvSettingsForm({ settings }: { settings: TvSlideSetting[] }) {
  const [rows, setRows] = useState(() => settings.map((row) => ({ ...row })));
  const [saveState, saveAction, saving] = useActionState(saveSalesDashboardTvSettings, initialState);
  const [resetState, resetAction, resetting] = useActionState(resetSalesDashboardTvSettings, initialState);
  const sortedRows = useMemo(() => [...rows].sort((a, b) => a.displayOrder - b.displayOrder), [rows]);
  const enabledCount = rows.filter((row) => row.isEnabled).length;

  useEffect(() => {
    if (saveState.message) (saveState.ok ? feedback.success : feedback.error)(saveState.message);
  }, [saveState]);
  useEffect(() => {
    if (resetState.message) {
      (resetState.ok ? feedback.success : feedback.error)(resetState.message);
      if (resetState.ok) setRows(TV_SLIDE_KEYS.map((slideKey, displayOrder) => ({ slideKey, isEnabled: true, displayOrder, durationSeconds: 30 })));
    }
  }, [resetState]);

  function updateRow(slideKey: TvSlideKey, update: Partial<TvSlideSetting>) {
    setRows((current) => current.map((row) => row.slideKey === slideKey ? { ...row, ...update } : row));
  }
  function move(slideKey: TvSlideKey, direction: -1 | 1) {
    const index = sortedRows.findIndex((row) => row.slideKey === slideKey);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= sortedRows.length) return;
    const next = sortedRows.map((row) => ({ ...row }));
    [next[index].displayOrder, next[target].displayOrder] = [next[target].displayOrder, next[index].displayOrder];
    setRows(next);
  }

  return <Panel title="TV rotation settings"><form className="grid gap-3" action={saveAction}>
    <input type="hidden" name="settings" value={JSON.stringify(rows)} readOnly />
    <div className="grid gap-2" role="list" aria-label="TV slides">
      {sortedRows.map((row, index) => {
        const durationInvalid = !Number.isInteger(row.durationSeconds) || row.durationSeconds < 10 || row.durationSeconds > 300;
        const cannotDisable = row.isEnabled && enabledCount === 1;
        return <div key={row.slideKey} className="grid gap-2 rounded-md border border-border/80 bg-background/30 p-3 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-center">
          <div className="flex items-center gap-3"><span className="w-5 text-xs tabular-nums text-muted-foreground">{index + 1}</span><label className="flex items-center gap-2 text-sm font-medium"><input type="checkbox" checked={row.isEnabled} disabled={cannotDisable} onChange={(event) => updateRow(row.slideKey, { isEnabled: event.target.checked })} />{LABELS[row.slideKey]}</label></div>
          <label className="flex items-center gap-2 text-xs text-muted-foreground">Seconds<Input aria-invalid={durationInvalid} className="w-24" type="number" min={10} max={300} step={1} value={row.durationSeconds} onChange={(event) => updateRow(row.slideKey, { durationSeconds: Number(event.target.value) })} /></label>
          <div className="flex gap-2 sm:justify-end"><button className="h-8 rounded-md border border-border px-2 text-xs text-muted-foreground transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-40" type="button" disabled={index === 0} onClick={() => move(row.slideKey, -1)}>Move Up</button><button className="h-8 rounded-md border border-border px-2 text-xs text-muted-foreground transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-40" type="button" disabled={index === sortedRows.length - 1} onClick={() => move(row.slideKey, 1)}>Move Down</button></div>
          {durationInvalid ? <p className="text-xs text-destructive sm:col-span-3 sm:pl-8">Use a whole number from 10 to 300 seconds.</p> : null}
        </div>;
      })}
    </div>
    {enabledCount === 0 ? <p className="text-xs text-destructive" role="alert">At least one slide must remain enabled.</p> : null}
    <div className="flex flex-wrap gap-2"><ActionButton type="submit" className="disabled:opacity-50" disabled={saving || resetting || enabledCount === 0 || rows.some((row) => !Number.isInteger(row.durationSeconds) || row.durationSeconds < 10 || row.durationSeconds > 300)}>{saving ? "Saving…" : "Save"}</ActionButton><button className="h-9 rounded-md border border-border px-3 text-sm text-muted-foreground transition-colors hover:bg-secondary disabled:opacity-50" type="submit" formAction={resetAction} disabled={saving || resetting}>{resetting ? "Resetting…" : "Reset to Defaults"}</button></div>
  </form></Panel>;
}
