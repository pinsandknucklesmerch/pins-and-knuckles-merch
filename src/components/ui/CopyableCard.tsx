"use client";

import { useEffect, useRef, useState, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { surfaceStyles } from "./styles";
import { copyText } from "./copyText";

type CopyableCardProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children" | "type"> & { value: string; actionLabel: string; children: ReactNode | ((state: "idle" | "copied" | "error") => ReactNode); onCopySuccess?: () => void; onCopyError?: () => void };

export function CopyableCard({ value, actionLabel, children, className, onClick, onKeyDown, onCopySuccess, onCopyError, ...props }: CopyableCardProps) {
  const [copyState, setCopyState] = useState<"idle" | "copied" | "error">("idle");
  const reset = useRef<number | null>(null);
  useEffect(() => () => { if (reset.current) window.clearTimeout(reset.current); }, []);
  async function copy() {
    if (await copyText(value)) { setCopyState("copied"); onCopySuccess?.(); }
    else { setCopyState("error"); onCopyError?.(); }
    if (reset.current) window.clearTimeout(reset.current);
    reset.current = window.setTimeout(() => setCopyState("idle"), 2200);
  }
  return <button type="button" aria-label={actionLabel} data-copy-state={copyState} className={cn(surfaceStyles.base, surfaceStyles.metric, surfaceStyles.actionable, "text-left", className)} onClick={(event) => { onClick?.(event); void copy(); }} onKeyDown={onKeyDown} {...props}>{typeof children === "function" ? children(copyState) : children}</button>;
}
