"use client";

import { Copy } from "lucide-react";
import { EmptyState } from "@/components/ui/EmptyState";
import { Surface } from "@/components/ui/Surface";
import { copyText } from "@/components/ui/copyText";
import type { QuickReferenceRecord } from "../types";

export function QuickReferenceList({ records }: { records: QuickReferenceRecord[] }) {
  if (!records.length) return <EmptyState title="No Quick Reference records." />;

  return <div className="grid items-start gap-3 md:grid-cols-2 xl:grid-cols-3">
    {records.map((record) => <QuickReferenceCard key={record.id} record={record} />)}
  </div>;
}

function QuickReferenceCard({ record }: { record: QuickReferenceRecord }) {
  return <Surface variant="compact" className="grid min-w-0 gap-2 bg-card/75">
    <div className="flex min-w-0 items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{record.category}</p>
        <h3 className="mt-0.5 min-w-0 text-sm font-semibold leading-5 text-foreground">{record.title}</h3>
      </div>
      <button type="button" onClick={() => { void copyText(record.body); }} className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md border border-input bg-background/55 px-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <Copy className="size-3.5" aria-hidden="true" />
        Copy
      </button>
    </div>
    <p className="whitespace-pre-wrap break-words text-sm leading-5 text-foreground">{record.body}</p>
    {record.warning ? <p className="rounded-md border border-amber-500/30 bg-amber-500/10 px-2.5 py-2 text-xs font-medium leading-5 text-amber-200">{record.warning}</p> : null}
  </Surface>;
}
