"use client";

import * as RadixSelect from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";
import { Children, isValidElement, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { controlClassName } from "./styles";

type SelectProps = {
  children: ReactNode;
  className?: string;
  defaultValue?: string;
  disabled?: boolean;
  id?: string;
  invalid?: boolean;
  name?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  value?: string;
  "aria-describedby"?: string;
  "aria-invalid"?: boolean;
};

function optionsFromChildren(children: ReactNode): ReactNode {
  return Children.map(children, (child) => {
    if (!isValidElement<{ children?: ReactNode; disabled?: boolean; label?: string; value?: string }>(child)) return child;
    if (child.type === "optgroup") {
      return <RadixSelect.Group key={child.key}><RadixSelect.Label className="px-2 py-1.5 text-xs font-medium text-muted-foreground">{child.props.label}</RadixSelect.Label>{optionsFromChildren(child.props.children)}</RadixSelect.Group>;
    }
    if (child.type !== "option") return child;
    const value = child.props.value ?? String(child.props.children ?? "");
    if (value === "") return null;
    return <RadixSelect.Item key={child.key ?? value} value={value} disabled={child.props.disabled} className="relative flex min-h-9 cursor-pointer select-none items-center rounded-sm py-2 pl-8 pr-3 text-sm text-popover-foreground outline-none data-[highlighted]:bg-primary/15 data-[highlighted]:text-foreground data-[state=checked]:bg-secondary data-[disabled]:pointer-events-none data-[disabled]:opacity-45"><RadixSelect.ItemIndicator className="absolute left-2 inline-flex size-4 items-center justify-center"><Check className="size-3.5" aria-hidden="true" /></RadixSelect.ItemIndicator><RadixSelect.ItemText className="min-w-0 truncate">{child.props.children}</RadixSelect.ItemText></RadixSelect.Item>;
  });
}

export function Select({ children, className, defaultValue, disabled, id, invalid, name, onValueChange, placeholder, required, value, "aria-describedby": ariaDescribedBy, "aria-invalid": ariaInvalid }: SelectProps) {
  return <RadixSelect.Root value={value || undefined} defaultValue={defaultValue || undefined} onValueChange={onValueChange} disabled={disabled} name={name} required={required}><RadixSelect.Trigger id={id} aria-describedby={ariaDescribedBy} aria-invalid={invalid ?? ariaInvalid} className={cn(controlClassName, "h-9 flex items-center justify-between gap-2 pr-2 text-left data-[placeholder]:text-muted-foreground", className)}><RadixSelect.Value placeholder={placeholder} /><RadixSelect.Icon asChild><ChevronDown className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" /></RadixSelect.Icon></RadixSelect.Trigger><RadixSelect.Portal><RadixSelect.Content position="popper" sideOffset={6} className="z-50 w-[var(--radix-select-trigger-width)] overflow-hidden rounded-[var(--hub-control-radius)] border border-border bg-popover text-popover-foreground shadow-lg"><RadixSelect.Viewport className="max-h-72 p-1">{optionsFromChildren(children)}</RadixSelect.Viewport></RadixSelect.Content></RadixSelect.Portal></RadixSelect.Root>;
}
