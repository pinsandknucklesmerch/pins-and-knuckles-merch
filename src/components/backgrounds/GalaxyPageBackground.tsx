import Galaxy from "./Galaxy";

type GalaxyPageBackgroundProps = {
  children: React.ReactNode;
};

export function GalaxyPageBackground({ children }: GalaxyPageBackgroundProps) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-black text-foreground">
      <div className="pointer-events-none absolute inset-0 z-0" aria-hidden="true">
        <Galaxy
          mouseRepulsion
          mouseInteraction
          density={1}
          glowIntensity={0.3}
          saturation={0}
          hueShift={140}
          twinkleIntensity={0.3}
          rotationSpeed={0.1}
          repulsionStrength={2}
          autoCenterRepulsion={0}
          starSpeed={0.5}
          speed={1}
          transparent
        />
      </div>
      <div className="relative z-10 min-h-screen">{children}</div>
    </main>
  );
}
