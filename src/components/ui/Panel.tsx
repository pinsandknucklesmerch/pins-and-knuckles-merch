import { cn } from "@/lib/utils";

type PanelProps = {
  children: React.ReactNode;
  className?: string;
  title?: string;
};

export function Panel({ children, className, title }: PanelProps) {
  return (
    <section
      className={cn("rounded-lg border border-border bg-card p-4", className)}
    >
      {title ? (
        <h2 className="mb-3 text-sm font-semibold text-foreground">{title}</h2>
      ) : null}
      {children}
    </section>
  );
}
