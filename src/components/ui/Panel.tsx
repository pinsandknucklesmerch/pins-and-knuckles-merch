import { cn } from "@/lib/utils";
import { BentoPanel } from "@/components/ui/BentoPanel";

type PanelProps = {
  children: React.ReactNode;
  className?: string;
  title?: string;
};

export function Panel({ children, className, title }: PanelProps) {
  return (
    <BentoPanel className={cn("p-4", className)}>
      {title ? (
        <h2 className="mb-3 text-sm font-semibold text-foreground">{title}</h2>
      ) : null}
      {children}
    </BentoPanel>
  );
}
