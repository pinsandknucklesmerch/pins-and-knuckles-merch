"use client";

import { useEffect, useState } from "react";
import type { ComponentType } from "react";
import { useBackgroundAnimationPreference } from "./backgroundAnimationPreference";

type GalaxyProps = {
  mouseRepulsion?: boolean;
  mouseInteraction?: boolean;
  density?: number;
  glowIntensity?: number;
  saturation?: number;
  hueShift?: number;
  twinkleIntensity?: number;
  rotationSpeed?: number;
  repulsionStrength?: number;
  autoCenterRepulsion?: number;
  starSpeed?: number;
  speed?: number;
  transparent?: boolean;
};

type GalaxyComponent = ComponentType<GalaxyProps>;
type BackgroundLayerProps = { variant: "public" | "hub" };

const galaxyProps: Record<BackgroundLayerProps["variant"], GalaxyProps> = {
  public: {
    mouseRepulsion: true,
    mouseInteraction: true,
    density: 1,
    glowIntensity: 0.3,
    saturation: 0,
    hueShift: 140,
    twinkleIntensity: 0.3,
    rotationSpeed: 0.1,
    repulsionStrength: 2,
    autoCenterRepulsion: 0,
    starSpeed: 0.5,
    speed: 1,
    transparent: true,
  },
  hub: {
    mouseRepulsion: false,
    mouseInteraction: false,
    density: 0.7,
    glowIntensity: 0.16,
    saturation: 0,
    hueShift: 140,
    twinkleIntensity: 0.15,
    rotationSpeed: 0.03,
    starSpeed: 0.2,
    speed: 0.4,
    transparent: true,
  },
};

export function BackgroundLayer({ variant }: BackgroundLayerProps) {
  const { enabled } = useBackgroundAnimationPreference();
  const [Galaxy, setGalaxy] = useState<GalaxyComponent | null>(null);

  useEffect(() => {
    if (!enabled) {
      setGalaxy(null);
      return;
    }

    let active = true;
    void import("./Galaxy").then((module) => {
      if (active) setGalaxy(() => module.default as GalaxyComponent);
    });

    return () => {
      active = false;
    };
  }, [enabled]);

  const isPublic = variant === "public";
  const staticSurface = isPublic ? "absolute inset-0 bg-black" : "fixed inset-0 bg-background";
  const animationSurface = isPublic ? "absolute inset-0 z-0" : "fixed inset-0 z-0";

  return (
    <>
      <div className={staticSurface} aria-hidden="true" />
      {enabled && Galaxy ? (
        <div className={animationSurface} aria-hidden="true">
          <Galaxy {...galaxyProps[variant]} />
        </div>
      ) : null}
    </>
  );
}
