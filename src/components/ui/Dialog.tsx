"use client";

import { useEffect, useId, useRef, type ReactNode, type RefObject } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

const focusableSelector = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

type DialogProps = {
  children: ReactNode;
  className?: string;
  description?: ReactNode;
  dialogRef?: RefObject<HTMLDialogElement | null>;
  onClose: () => void;
  open: boolean;
  title: ReactNode;
  closeLabel?: string;
};

export function Dialog({ children, className, description, dialogRef: forwardedRef, onClose, open, title, closeLabel = "Close" }: DialogProps) {
  const internalRef = useRef<HTMLDialogElement>(null);
  const dialogRef = forwardedRef ?? internalRef;
  const titleId = useId();
  const descriptionId = useId();
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => { onCloseRef.current = onClose; }, [onClose]);

  useEffect(() => {
    if (!open) return;
    const dialog = dialogRef.current;
    if (!dialog) return;
    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    if (!dialog.open) dialog.showModal();
    const frame = requestAnimationFrame(() => {
      const initialFocus = dialog.querySelector<HTMLElement>("[data-autofocus]") ?? dialog.querySelector<HTMLElement>(focusableSelector);
      initialFocus?.focus();
    });
    const handleKeyDown = (event: KeyboardEvent) => {
      const active = document.activeElement;
      if (!dialog.contains(active)) return;
      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current();
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = Array.from(dialog.querySelectorAll<HTMLElement>(focusableSelector));
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("keydown", handleKeyDown);
      if (dialog.open) dialog.close();
      previousFocusRef.current?.focus();
    };
  }, [dialogRef, open]);

  if (!open) return null;
  return createPortal(
    <dialog
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
      onCancel={(event) => { event.preventDefault(); onCloseRef.current(); }}
      onMouseDown={(event) => { if (event.target === event.currentTarget) onCloseRef.current(); }}
      className={cn("fixed inset-0 z-[60] m-auto max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] overflow-y-auto rounded-lg border border-border bg-card p-0 text-foreground shadow-lg backdrop:bg-black/70", className)}
    >
      <div className="flex items-start justify-between gap-4 border-b border-border px-4 py-3">
        <div className="min-w-0">
          <h2 id={titleId} className="text-base font-semibold">{title}</h2>
          {description ? <p id={descriptionId} className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
        </div>
        <button
          type="button"
          aria-label={closeLabel}
          onClick={onClose}
          className="inline-flex min-h-9 min-w-9 shrink-0 items-center justify-center rounded-md px-2 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span aria-hidden="true">×</span>
        </button>
      </div>
      <div className="p-4">{children}</div>
    </dialog>,
    document.body,
  );
}
