"use client";

import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { ChevronDown } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type ActionMenuItem = { label: string; onSelect: () => void; disabled?: boolean; destructive?: boolean };
type ActionMenuProps = { label: string; items: ActionMenuItem[]; disabled?: boolean; pending?: boolean; icon?: ReactNode; className?: string };

export function ActionMenu({ label, items, disabled = false, pending = false, icon, className }: ActionMenuProps) {
  return <DropdownMenu.Root><DropdownMenu.Trigger type="button" disabled={disabled || pending} className={cn("inline-flex h-9 items-center justify-center gap-2 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50", className)}>{icon}{pending ? "Loading" : label}<ChevronDown className="size-4" aria-hidden="true" /></DropdownMenu.Trigger><DropdownMenu.Portal><DropdownMenu.Content align="end" sideOffset={6} className="z-50 min-w-36 rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-lg"><DropdownMenu.Arrow className="fill-popover" />{items.map((item) => <DropdownMenu.Item key={item.label} disabled={item.disabled} onSelect={item.onSelect} className={cn("flex min-h-8 cursor-pointer select-none items-center rounded-sm px-2 text-sm outline-none data-[highlighted]:bg-primary/15 data-[highlighted]:text-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50", item.destructive && "text-destructive data-[highlighted]:bg-destructive/10 data-[highlighted]:text-destructive")}>{item.label}</DropdownMenu.Item>)}</DropdownMenu.Content></DropdownMenu.Portal></DropdownMenu.Root>;
}
