"use client";

import { useEffect, useRef, useState, type HTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { surfaceStyles } from "./styles";
import { copyText } from "./copyText";

type CopyableCardProps = Omit<HTMLAttributes<HTMLDivElement>, "onCopy" | "children"> & { value: string; actionLabel: string; children: ReactNode | ((state: "idle" | "copied" | "error") => ReactNode); onCopySuccess?: () => void; onCopyError?: () => void };
const interactiveSelector = "a,button,input,textarea,select,[role='button'],[contenteditable='true']";

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
  function canCopy(target: EventTarget | null) { return !(target instanceof Element && target.closest(interactiveSelector)); }
  return <div role="button" tabIndex={0} aria-label={actionLabel} data-copy-state={copyState} className={cn(surfaceStyles.base, surfaceStyles.metric, surfaceStyles.actionable, className)} onClick={(event) => { onClick?.(event); if (canCopy(event.target)) void copy(); }} onKeyDown={(event) => { onKeyDown?.(event); if ((event.key === "Enter" || event.key === " ") && canCopy(event.target)) { event.preventDefault(); void copy(); } }} {...props}>{typeof children === "function" ? children(copyState) : children}</div>;
}
