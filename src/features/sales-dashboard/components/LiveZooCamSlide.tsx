"use client";

import { useState } from "react";

import { SMITHSONIAN_PANDA_CAM, type OfficialZooCamSource } from "../lib/liveZooCam";
import styles from "./LiveZooCamSlide.module.css";

type LiveZooCamSlideProps = {
  source?: OfficialZooCamSource;
};

type ZooCamStatus = "loading" | "live" | "fallback";

export function LiveZooCamSlide({ source = SMITHSONIAN_PANDA_CAM }: LiveZooCamSlideProps) {
  const [status, setStatus] = useState<ZooCamStatus>(source.embeddablePlayerUrl ? "loading" : "fallback");
  const canEmbed = Boolean(source.embeddablePlayerUrl) && status !== "fallback";

  if (!canEmbed) {
    return <section className={styles.fallback} data-tv-view="live-zoo-cam" aria-labelledby="zoo-cam-title">
      <div className={styles.fallbackContent} data-tv-group="zoo-cam-content">
        <h2 id="zoo-cam-title">{source.name}</h2>
        <p>Live from {source.provider}</p>
        <a className={styles.openLink} href={source.officialPageUrl} target="_blank" rel="noreferrer">
          Open live cam
        </a>
      </div>
    </section>;
  }

  return <section className={styles.live} data-tv-view="live-zoo-cam" aria-labelledby="zoo-cam-title">
    <div className={styles.playerFrame}>
      {status === "loading" ? <div className={styles.loading} aria-live="polite">Loading live cam</div> : null}
      <iframe
        className={styles.player}
        title={`${source.provider} — ${source.name}`}
        src={source.embeddablePlayerUrl ?? undefined}
        allow={source.iframeAllow}
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
        onLoad={() => setStatus("live")}
        onError={() => setStatus("fallback")}
      />
    </div>
    <p className={styles.attribution}>{source.provider} — {source.name}</p>
  </section>;
}
