"use client";

import { useId, useState } from "react";
import { EmptyState } from "@/components/ui/EmptyState";
import { Panel } from "@/components/ui/Panel";
import { normalizeAnalyticsPageTitle } from "../lib/pageTitle";
import type { Ga4WebsiteAnalyticsReport } from "../server/ga4";
import styles from "./AnalyticsTopPages.module.css";

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-GB", { maximumFractionDigits: 0 }).format(value);
}

export function AnalyticsTopPages({ pages }: { pages: Ga4WebsiteAnalyticsReport["topPages"] }) {
  const [showAll, setShowAll] = useState(false);
  const disclosureId = useId();
  const sortedPages = [...pages].sort((left, right) => right.pageViews - left.pageViews);
  const visiblePages = showAll ? sortedPages : sortedPages.slice(0, 5);
  const largestPageViews = Math.max(1, ...sortedPages.map((page) => page.pageViews));

  return <Panel title="Top pages" className={styles.panel}>
    {sortedPages.length ? <>
      <ol id={disclosureId} className={styles.list}>
        {visiblePages.map((page, index) => {
          const title = normalizeAnalyticsPageTitle(page.title, page.path);
          return <li key={`${page.path ?? page.title}-${index}`} className={styles.item}>
          <div className={styles.titleRow}><span className={styles.title} title={title}>{title}</span><strong>{formatNumber(page.pageViews)}</strong></div>
          <div className={styles.track} role="progressbar" aria-label={`${title} page views`} aria-valuemin={0} aria-valuemax={largestPageViews} aria-valuenow={page.pageViews}><div className={styles.bar} style={{ width: `${(page.pageViews / largestPageViews) * 100}%` }} /></div>
          {page.path ? <small title={page.path}>{page.path}</small> : null}
        </li>;
        })}
      </ol>
      {sortedPages.length > 5 ? <button type="button" className={styles.toggle} aria-expanded={showAll} aria-controls={disclosureId} onClick={() => setShowAll((current) => !current)}>{showAll ? "Show less" : "View all"}</button> : null}
    </> : <EmptyState title="No page data" />}
  </Panel>;
}
