import { cn } from "@/lib/utils";
import { Surface } from "@/components/ui/Surface";

type PanelProps = {
  children: React.ReactNode;
  className?: string;
  title?: string;
};

export function Panel({ children, className, title }: PanelProps) {
  return (
    <Surface className={cn("", className)}>
      {title ? (
        <h2 className="mb-3 text-sm font-semibold text-foreground">{title}</h2>
      ) : null}
      {children}
    </Surface>
  );
}
