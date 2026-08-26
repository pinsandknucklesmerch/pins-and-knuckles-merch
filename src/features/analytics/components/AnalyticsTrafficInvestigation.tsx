"use client";

import { useEffect, useState } from "react";
import { Dialog } from "@/components/ui/Dialog";
import { EmptyState } from "@/components/ui/EmptyState";
import { ErrorState } from "@/components/ui/ErrorState";
import type { TrafficInvestigation, TrafficInvestigationRow } from "../lib/trafficInvestigation";
import styles from "./AnalyticsTrafficInvestigation.module.css";

type InvestigationSelection = { startDate: string; endDate: string } | null;
type InvestigationTab = "acquisition" | "landingPages" | "geography" | "devices";

const TABS: Array<{ key: InvestigationTab; label: string }> = [{ key: "acquisition", label: "Acquisition" }, { key: "landingPages", label: "Landing Pages" }, { key: "geography", label: "Geography" }, { key: "devices", label: "Devices" }];
const number = new Intl.NumberFormat("en-GB", { maximumFractionDigits: 0 });

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`));
}

function rangeLabel(selection: NonNullable<InvestigationSelection>) {
  return selection.startDate === selection.endDate ? formatDate(selection.startDate) : `${formatDate(selection.startDate).replace(/ \d{4}$/, "")}–${formatDate(selection.endDate)}`;
}

function delta(value: number) {
  return `${value > 0 ? "+" : ""}${number.format(value)}`;
}

function change(value: TrafficInvestigationRow["sessions"]) {
  const percentage = value.percentageChange;
  return `${delta(value.difference)}${percentage === null ? "" : ` · ${percentage > 0 ? "+" : ""}${percentage.toFixed(1)}%`}`;
}

function Metric({ label, value }: { label: string; value: TrafficInvestigation["summary"]["sessions"] }) {
  return <div className={styles.metric}><span>{label}</span><strong>{number.format(value.selected)}</strong><small className={value.difference > 0 ? styles.positive : value.difference < 0 ? styles.negative : styles.neutral}>{delta(value.difference)} vs {number.format(value.baselineAverage)} avg</small></div>;
}

function Rows({ rows, showCountryId = false }: { rows: TrafficInvestigationRow[]; showCountryId?: boolean }) {
  if (!rows.length) return <EmptyState title="No data for this range" />;
  return <ol className={styles.rows}>{rows.slice(0, 12).map((row) => <li key={`${row.label}-${row.countryId ?? ""}`}><div><strong title={row.label}>{row.label}</strong>{showCountryId && row.countryId ? <small>{row.countryId}</small> : null}</div><span>{number.format(row.sessions.selected)}</span><span>{number.format(row.sessions.baselineAverage)}</span><span className={row.sessions.difference > 0 ? styles.positive : row.sessions.difference < 0 ? styles.negative : styles.neutral}>{change(row.sessions)}</span></li>)}</ol>;
}

export function AnalyticsTrafficInvestigation({ selection, onClose }: { selection: InvestigationSelection; onClose: () => void }) {
  const [tab, setTab] = useState<InvestigationTab>("acquisition");
  const [data, setData] = useState<TrafficInvestigation | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const startDate = selection?.startDate;
  const endDate = selection?.endDate;
  const label = startDate && endDate ? rangeLabel({ startDate, endDate }) : "Traffic investigation";

  useEffect(() => {
    if (!startDate || !endDate) return;
    const controller = new AbortController();
    setStatus("loading");
    setData(null);
    fetch(`/api/analytics/traffic-investigation?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("Analytics investigation failed");
        return response.json() as Promise<TrafficInvestigation>;
      })
      .then((result) => { if (!controller.signal.aborted) { setData(result); setStatus("idle"); } })
      .catch(() => { if (!controller.signal.aborted) setStatus("error"); });
    return () => controller.abort();
  }, [startDate, endDate]);

  const rows = data ? data[tab] : [];
  return <Dialog open={Boolean(selection)} onClose={onClose} title={label} className="m-0 h-[100dvh] max-h-none w-full rounded-none sm:w-[min(42rem,calc(100vw-1rem))] sm:rounded-lg md:inset-y-0 md:right-0 md:left-auto md:w-[42rem] md:rounded-none">
    <div className={styles.root}>
      {status === "loading" ? <div className={styles.loading} role="status">Loading investigation…</div> : null}
      {status === "error" ? <ErrorState title="Investigation unavailable" message="Please try again shortly." /> : null}
      {data ? <>
        <section className={styles.metrics} aria-label="Traffic investigation summary"><Metric label="Sessions" value={data.summary.sessions} /><Metric label="Active Users" value={data.summary.activeUsers} /><Metric label="Page Views" value={data.summary.pageViews} /></section>
        {data.contributors.length ? <section className={styles.contributors}><h3>Largest increases</h3><ul>{data.contributors.map((row) => <li key={row.label}>{row.label} <strong>{delta(row.sessions.difference)} sessions</strong></li>)}</ul></section> : null}
        <div className={styles.tabs} role="tablist" aria-label="Traffic investigation breakdown">{TABS.map((item) => <button key={item.key} type="button" role="tab" aria-selected={tab === item.key} className={tab === item.key ? styles.activeTab : undefined} onClick={() => setTab(item.key)}>{item.label}</button>)}</div>
        <div className={styles.columnLabels}><span>Selected</span><span>Baseline avg</span><span>Difference</span></div>
        <Rows rows={rows} showCountryId={tab === "geography"} />
      </> : null}
    </div>
  </Dialog>;
}
