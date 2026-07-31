"use client";

import { toast } from "sonner";

export const feedback = {
  success: (message: string) => toast.success(message),
  error: (message: string) => toast.error(message),
  copied: () => toast.success("Copied to clipboard", { id: "clipboard" }),
  copyFailed: () => toast.error("Could not copy", { id: "clipboard" }),
  exportCreated: () => toast.success("Export created"),
  exportFailed: () => toast.error("Could not export"),
};

export function isInlineValidation(message: string) {
  return /required|valid|must be|select an|needs a|already uses|cannot deactivate|cannot delete/i.test(message);
}
