import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import styles from "./BentoPanel.module.css";

export type BentoPanelProps = HTMLAttributes<HTMLDivElement> & {
  interactive?: boolean;
  accent?: "primary" | "accent" | "neutral";
  glow?: boolean;
};

export function BentoPanel({
  className,
  interactive = false,
  accent = "primary",
  glow = false,
  ...props
}: BentoPanelProps) {
  return (
    <div
      className={cn(
        styles.panel,
        accent === "accent" && styles.accent,
        accent === "neutral" && styles.neutral,
        interactive && styles.interactive,
        glow && styles.glow,
        className,
      )}
      {...props}
    />
  );
}
