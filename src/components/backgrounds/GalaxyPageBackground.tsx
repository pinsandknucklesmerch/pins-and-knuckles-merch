import { BackgroundLayer } from "./BackgroundLayer";

type GalaxyPageBackgroundProps = {
  children: React.ReactNode;
};

export function GalaxyPageBackground({ children }: GalaxyPageBackgroundProps) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-black text-foreground">
      <BackgroundLayer variant="public" />
      <div className="relative z-10 min-h-screen">{children}</div>
    </main>
  );
}
