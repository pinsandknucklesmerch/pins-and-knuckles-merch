"use client";

import {
  isBackgroundAnimationControlDisabled,
  useBackgroundAnimationPreference,
} from "@/components/backgrounds/backgroundAnimationPreference";

export function BackgroundAnimationPreference() {
  const { enabled, reducedMotion, ready, setEnabled } = useBackgroundAnimationPreference();
  const disabled = isBackgroundAnimationControlDisabled(ready, reducedMotion);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="grid gap-1">
        <span className="text-sm font-medium">Animated background</span>
        <span className="text-xs text-muted-foreground">
          {reducedMotion ? "Unavailable while reduced motion is enabled" : enabled ? "On" : "Off"}
        </span>
      </div>
      <label className="inline-flex min-h-9 items-center gap-2 text-sm">
        <input
          type="checkbox"
          role="switch"
          checked={enabled}
          disabled={disabled}
          onChange={(event) => setEnabled(event.target.checked)}
          className="size-4 accent-primary disabled:cursor-not-allowed disabled:opacity-50"
        />
        <span>{enabled ? "Enabled" : "Disabled"}</span>
      </label>
    </div>
  );
}
