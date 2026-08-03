import { cn } from "@/lib/utils";
import { Surface } from "@/components/ui/Surface";

type PanelProps = {
  children: React.ReactNode;
  className?: string;
  title?: string;
  tvGroup?: string;
};

export function Panel({ children, className, title, tvGroup }: PanelProps) {
  return (
    <Surface className={cn("", className)} data-tv-group={tvGroup}>
      {title ? (
        <h2 className="mb-3 text-sm font-semibold text-foreground">{title}</h2>
      ) : null}
      {children}
    </Surface>
  );
}
