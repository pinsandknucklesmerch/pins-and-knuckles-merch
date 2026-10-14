"use client";

import { ActionButton } from "@/components/ui/ActionButton";
import { nextChecklistStatus, STATUS_LABELS, type ChecklistStatus } from "../domain/checklist";
import styles from "./ChecklistStatusControl.module.css";

type Props = { status: ChecklistStatus; label: string; readOnly?: boolean; pending?: boolean; onChange?: (status: ChecklistStatus) => void };

export function ChecklistStatusControl({ status, label, readOnly = true, pending = false, onChange }: Props) {
  const disabled = readOnly || pending;
  const next = nextChecklistStatus(status);
  const description = pending ? "Saving" : readOnly ? "Read only" : `Change to ${STATUS_LABELS[next]}`;
  return <div className={styles.control} data-status={status} aria-busy={pending}>
    <ActionButton
      disabled={disabled}
      aria-label={`${label}: ${STATUS_LABELS[status]}. ${description}`}
      onClick={() => { if (!disabled) onChange?.(next); }}
      className={styles.button}
    >{STATUS_LABELS[status]}</ActionButton>
  </div>;
}
