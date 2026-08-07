"use client";

import { Bug, ChevronDown, Gauge, Menu, Users, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { hubDeveloperNavigation, hubFeatureNavigation, hubProfileNavigation } from "@/config/hubNavigation";
import { ReportIssueDialog } from "@/features/feedback/components/ReportIssueDialog";

type SidebarNavProps = { canAdmin: boolean; canDeveloper: boolean };

export function SidebarNav({ canAdmin, canDeveloper }: SidebarNavProps) {
  const pathname = usePathname();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [mobileOpen, setMobileOpen] = useState(false);
  const mobileTriggerRef = useRef<HTMLButtonElement>(null);
  const mobileNavigationRef = useRef<HTMLDivElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const isGroupOpen = (href: string, children?: Array<{ href: string }>) => Boolean(children?.some((child) => pathname === child.href || pathname.startsWith(`${child.href}/`))) || expanded[href] === true;
  const renderItem = (item: typeof hubFeatureNavigation[number], onNavigate: () => void, idPrefix: string) => {
    const open = isGroupOpen(item.href, item.children);
    const childId = `${idPrefix}-${item.label.toLowerCase().replaceAll(" ", "-")}`;
    return <div key={item.label}><div className="flex items-center gap-1"><Link href={item.href} onClick={onNavigate} className="flex h-9 min-w-0 flex-1 items-center gap-2 rounded-md px-2 text-sm text-muted-foreground transition-colors hover:bg-primary/10 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"><item.icon className="size-4" aria-hidden="true" />{item.label}</Link>{item.children ? <button type="button" aria-label={`${open ? "Collapse" : "Expand"} ${item.label}`} aria-expanded={open} aria-controls={childId} onClick={() => setExpanded((current) => ({ ...current, [item.href]: !open }))} className="inline-flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-primary/10 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"><ChevronDown className={`size-4 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden="true" /></button> : null}</div>{item.children && open ? <div id={childId} className="space-y-0.5 pb-1 pl-8">{item.children.map((child) => <Link key={child.href} href={child.href} onClick={onNavigate} className="flex h-8 items-center rounded-md px-2 text-sm text-muted-foreground transition-colors hover:bg-primary/10 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">{child.label}</Link>)}</div> : null}</div>;
  };
  const navigation = (onNavigate: () => void, idPrefix: string) => <nav className="space-y-1"><Link href="/hub" onClick={onNavigate} className="flex h-9 items-center gap-2 rounded-md px-2 text-sm text-muted-foreground transition-colors hover:bg-primary/10 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"><Gauge className="size-4" aria-hidden="true" />Pins Hub</Link>{hubFeatureNavigation.map((item) => renderItem(item, onNavigate, idPrefix))}{canAdmin ? <Link href="/hub/team" onClick={onNavigate} className="flex h-9 items-center gap-2 rounded-md px-2 text-sm text-muted-foreground transition-colors hover:bg-primary/10 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"><Users className="size-4" aria-hidden="true" />User Access Management</Link> : null}{canDeveloper ? renderItem(hubDeveloperNavigation, onNavigate, idPrefix) : null}</nav>;
  const account = <div className="grid gap-1"><ReportIssueDialog triggerClassName="flex h-9 items-center gap-2 rounded-md px-2 text-sm text-muted-foreground transition-colors hover:bg-primary/10 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"><Bug className="size-4" aria-hidden="true" />Report an issue</ReportIssueDialog><Link href={hubProfileNavigation.href} onClick={() => setMobileOpen(false)} className="flex h-9 items-center gap-2 rounded-md px-2 text-sm text-muted-foreground transition-colors hover:bg-primary/10 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"><hubProfileNavigation.icon className="size-4" aria-hidden="true" />{hubProfileNavigation.label}</Link><LogoutButton /></div>;
  useEffect(() => {
    if (!mobileOpen) {
      (previousFocusRef.current ?? mobileTriggerRef.current)?.focus();
      previousFocusRef.current = null;
      return;
    }
    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const frame = requestAnimationFrame(() => mobileNavigationRef.current?.querySelector<HTMLElement>("button, a")?.focus());
    const handleKeyDown = (event: KeyboardEvent) => {
      const navigation = mobileNavigationRef.current;
      if (!navigation) return;
      if (event.key === "Escape") {
        event.preventDefault();
        setMobileOpen(false);
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = Array.from(navigation.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'));
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => { cancelAnimationFrame(frame); document.removeEventListener("keydown", handleKeyDown); };
  }, [mobileOpen]);

  return <><aside className="hidden w-60 shrink-0 border-r border-border/80 bg-card/65 px-3 py-4 backdrop-blur-md md:flex md:flex-col"><div><Link href="/hub" className="mb-5 flex items-center rounded-md px-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"><Image src="/branding/P&K_LOGO.png" alt="Pins & Knuckles" width={180} height={48} priority className="h-auto w-40" /></Link>{navigation(() => {}, "sidebar-group")}</div><div className="mt-auto">{account}</div></aside><div className="md:hidden"><header className="fixed inset-x-0 top-0 z-50 border-b border-border/80 bg-card/90 px-4 py-2 backdrop-blur-md"><div className="flex items-center justify-between"><Link href="/hub" className="flex items-center rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"><Image src="/branding/P&K_LOGO.png" alt="Pins & Knuckles" width={140} height={38} priority className="h-auto w-28" /></Link><button ref={mobileTriggerRef} type="button" aria-label={mobileOpen ? "Close navigation" : "Open navigation"} aria-expanded={mobileOpen} aria-controls="mobile-sidebar-navigation" onClick={() => setMobileOpen((open) => !open)} className="inline-flex size-9 items-center justify-center rounded-md text-muted-foreground hover:bg-primary/10 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">{mobileOpen ? <X className="size-4" aria-hidden="true" /> : <Menu className="size-4" aria-hidden="true" />}</button></div></header>{mobileOpen ? <><button type="button" aria-label="Close navigation backdrop" onClick={() => setMobileOpen(false)} className="fixed inset-0 z-40 bg-black/65" /><div ref={mobileNavigationRef} id="mobile-sidebar-navigation" role="dialog" aria-modal="true" aria-label="Mobile navigation" className="fixed inset-x-0 top-0 z-50 max-h-[100dvh] overflow-y-auto border-b border-border/80 bg-card px-4 pb-4 pt-2 shadow-lg"><div className="flex items-center justify-between"><Link href="/hub" onClick={() => setMobileOpen(false)} className="flex items-center rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"><Image src="/branding/P&K_LOGO.png" alt="Pins & Knuckles" width={140} height={38} priority className="h-auto w-28" /></Link><button type="button" aria-label="Close navigation" onClick={() => setMobileOpen(false)} className="inline-flex size-9 items-center justify-center rounded-md text-muted-foreground hover:bg-primary/10 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"><X className="size-4" aria-hidden="true" /></button></div><div className="mt-2 grid gap-3 border-t border-border/80 pt-3">{navigation(() => setMobileOpen(false), "mobile-sidebar-group")}{account}</div></div></> : null}</div></>;
}
