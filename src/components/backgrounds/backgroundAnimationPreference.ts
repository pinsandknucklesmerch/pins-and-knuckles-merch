"use client";

import { useCallback, useEffect, useState } from "react";

export const BACKGROUND_ANIMATION_STORAGE_KEY = "pins-hub-background-animation";
export const BACKGROUND_ANIMATION_CHANGE_EVENT = "pins-hub-background-animation-change";

export function readStoredBackgroundAnimation(value: string | null): boolean {
  return value === "true";
}

type BackgroundAnimationPreference = {
  enabled: boolean;
  reducedMotion: boolean;
  ready: boolean;
  setEnabled: (enabled: boolean) => void;
};

export function useBackgroundAnimationPreference(): BackgroundAnimationPreference {
  const [state, setState] = useState({ enabled: false, reducedMotion: false, ready: false });

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    const readPreference = (event?: Event) => {
      let storedValue: string | null = null;
      try {
        storedValue = window.localStorage.getItem(BACKGROUND_ANIMATION_STORAGE_KEY);
      } catch {
        // Private browsing and storage policies can make localStorage unavailable.
      }

      if (event instanceof CustomEvent && typeof event.detail === "boolean") {
        storedValue = String(event.detail);
      }

      const reducedMotion = mediaQuery.matches;
      setState({
        enabled: !reducedMotion && readStoredBackgroundAnimation(storedValue),
        reducedMotion,
        ready: true,
      });
    };

    readPreference();
    mediaQuery.addEventListener("change", readPreference);
    window.addEventListener(BACKGROUND_ANIMATION_CHANGE_EVENT, readPreference);
    window.addEventListener("storage", readPreference);
    return () => {
      mediaQuery.removeEventListener("change", readPreference);
      window.removeEventListener(BACKGROUND_ANIMATION_CHANGE_EVENT, readPreference);
      window.removeEventListener("storage", readPreference);
    };
  }, []);

  const setEnabled = useCallback((enabled: boolean) => {
    if (state.reducedMotion) return;

    try {
      window.localStorage.setItem(BACKGROUND_ANIMATION_STORAGE_KEY, String(enabled));
    } catch {
      // Keep the in-memory preference for this session when storage is unavailable.
    }

    setState((current) => ({ ...current, enabled }));
    window.dispatchEvent(new CustomEvent(BACKGROUND_ANIMATION_CHANGE_EVENT, { detail: enabled }));
  }, [state.reducedMotion]);

  return { ...state, setEnabled };
}
