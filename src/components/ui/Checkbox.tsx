import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import type { InputHTMLAttributes } from "react";

// Native checkbox semantics with the Hub focus ring and control vocabulary.
// Disabled controls keep their status appearance; callers decide editability.
export function Checkbox({ className, ...props }: Omit<InputHTMLAttributes<HTMLInputElement>, "type">) {
  return <span className="relative inline-flex shrink-0 align-middle">
    <input {...props} type="checkbox" className={cn("peer size-4 appearance-none rounded border border-input bg-background text-primary outline-none transition-colors checked:border-current checked:bg-current focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card disabled:cursor-not-allowed", className)} />
    <span className="pointer-events-none absolute inset-0 grid place-items-center text-primary-foreground opacity-0 peer-checked:opacity-100"><Check aria-hidden="true" className="h-3/4 w-3/4" strokeWidth={3} /></span>
  </span>;
}
