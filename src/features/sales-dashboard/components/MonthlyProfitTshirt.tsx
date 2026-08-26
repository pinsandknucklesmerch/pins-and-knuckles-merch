"use client";

import { useId, type CSSProperties } from "react";
import Image from "next/image";
import { monthlyProfitTshirtFillState } from "../lib/metricDisplay";
import styles from "./MonthlyProfitTshirt.module.css";

type MonthlyProfitTshirtProps = {
  value: number | null;
  target: number | null;
  tvMode?: boolean;
  ariaLabel?: string;
};

const SHIRT_VIEW_BOX = "0 0 1536 1024";
const SHIRT_FILL_BOTTOM = 930;
const SHIRT_FILL_RANGE = 850;

export function MonthlyProfitTshirt({ value, target, tvMode = false, ariaLabel }: MonthlyProfitTshirtProps) {
  const clipId = `monthly-profit-tshirt-${useId().replace(/:/g, "")}`;
  const { fillPercent, tone } = monthlyProfitTshirtFillState(value, target);
  const fillOffset = SHIRT_FILL_BOTTOM - (fillPercent / 100) * SHIRT_FILL_RANGE;
  const label = ariaLabel ?? `Monthly profit is ${fillPercent.toFixed(1)}% of target.`;

  return (
    <div className={`${styles.visual} ${tvMode ? styles.tvVisual : ""}`} role="img" aria-label={label}>
      <svg className={`${styles.liquid} ${tone === "green" ? styles.targetMet : styles.belowTarget}`} viewBox={SHIRT_VIEW_BOX} aria-hidden="true" focusable="false">
        <defs>
          <clipPath id={clipId} clipPathUnits="userSpaceOnUse">
            <path fillRule="evenodd" clipRule="evenodd" d="M510 171 626 121C662 170 713 197 768 197S874 170 910 121L1027 171 1206 319 1104 449 1026 394 1028 840C1028 880 1004 898 970 902H566C532 898 508 880 508 840L510 394 431 449 330 319ZM630 130C665 195 713 239 768 279 823 239 871 195 906 130L858 146C833 190 804 228 768 253 732 228 703 190 678 146Z" />
          </clipPath>
        </defs>
        {fillPercent > 0 ? <g clipPath={`url(#${clipId})`}>
          <g className={styles.fillLevel} style={{ transform: `translateY(${fillOffset}px)` } as CSSProperties}>
            <g className={styles.wavePrimary}>
              <path className={styles.waveFill} d="M-480 0C-360-34-240-34-120 0S120 34 240 0 480-34 600 0 840 34 960 0s240-34 360 0 240 34 360 0 240-34 360 0V1100H-480Z" />
              <path className={styles.waveHighlight} d="M-480 0C-360-34-240-34-120 0S120 34 240 0 480-34 600 0 840 34 960 0s240-34 360 0 240 34 360 0 240-34 360 0" />
            </g>
            <g className={styles.waveSecondary}>
              <path className={styles.waveFill} d="M-480 18C-350 62-240 62-110 18S130-26 260 18 500 62 630 18 870-26 1000 18 1240 62 1370 18 1610-26 1740 18 1980 62 2110 18V1100H-480Z" />
            </g>
          </g>
        </g> : null}
      </svg>
      <Image className={styles.shirtArtwork} src="/reference-assets/tshirt.png" alt="" aria-hidden="true" width={1536} height={1024} />
    </div>
  );
}
