import type { DetailsHTMLAttributes, ReactNode, HTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { surfaceStyles } from "./styles";

type SurfaceProps = HTMLAttributes<HTMLDivElement> & { variant?: "panel" | "compact" | "metric" | "actionable" | "collapsible"; magic?: boolean };

export function Surface({ className, variant = "panel", magic = false, ...props }: SurfaceProps) {
  return <div className={cn(surfaceStyles.base, surfaceStyles[variant], variant === "actionable" && surfaceStyles.actionable, magic && "bg-card/80 backdrop-blur-sm", className)} {...props} />;
}

type CollapsibleSurfaceProps = DetailsHTMLAttributes<HTMLDetailsElement> & { summary: ReactNode };

export function CollapsibleSurface({ summary, children, className, ...props }: CollapsibleSurfaceProps) {
  return <details className={cn(surfaceStyles.base, surfaceStyles.collapsible, className)} {...props}><summary className="cursor-pointer list-none px-[var(--hub-card-padding)] py-3 text-sm font-semibold text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden">{summary}</summary><div className="border-t border-border p-[var(--hub-card-padding)]">{children}</div></details>;
}
