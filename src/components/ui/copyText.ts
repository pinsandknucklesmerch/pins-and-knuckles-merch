import { feedback } from "./feedback.ts";

export async function copyText(value: string) {
  try {
    if (navigator.clipboard && window.isSecureContext) await navigator.clipboard.writeText(value);
    else {
      const textarea = document.createElement("textarea");
      textarea.value = value;
      textarea.setAttribute("readonly", "true");
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      try {
        textarea.select();
        if (!document.execCommand("copy")) throw new Error("Copy unavailable");
      } finally { textarea.remove(); }
    }
    feedback.copied();
    return true;
  } catch {
    feedback.copyFailed();
    return false;
  }
}
