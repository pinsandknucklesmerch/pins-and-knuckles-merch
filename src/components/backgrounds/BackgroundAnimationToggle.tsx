"use client";

import { useBackgroundAnimationPreference } from "./backgroundAnimationPreference";

type BackgroundAnimationToggleProps = {
  showLabel?: boolean;
};

export function BackgroundAnimationToggle({ showLabel = true }: BackgroundAnimationToggleProps) {
  const { enabled, ready, reducedMotion, setEnabled } = useBackgroundAnimationPreference();
  const disabled = !ready || reducedMotion;

  return (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      aria-label={reducedMotion ? "Background animation unavailable while reduced motion is enabled" : "Background animation"}
      disabled={disabled}
      onClick={() => setEnabled(!enabled)}
      className="inline-flex h-9 shrink-0 items-center gap-2 rounded-md px-2 text-sm text-muted-foreground transition-colors hover:bg-primary/10 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
    >
      {showLabel ? <span>Background</span> : null}
      <span className={`relative h-6 w-10 rounded-md border p-0.5 transition-colors ${enabled ? "border-primary/70 bg-primary/25" : "border-border bg-black/80"}`} aria-hidden="true">
        <span className={`block size-4 rounded-sm transition-transform ${enabled ? "translate-x-4 bg-primary shadow-sm" : "translate-x-0 bg-muted-foreground/60"}`} />
      </span>
    </button>
  );
}
