import { Panel } from "@/components/ui/Panel";

const rows = ["Garment / production cost", "Decoration cost", "Setup", "Delivery", "Unit price ex VAT", "Total ex VAT", "VAT", "Total inc VAT"];

export function UkStandardResults() {
  return <Panel className="grid min-w-0 content-start gap-3 xl:row-span-2" aria-label="UK Standard results">
    <h2 className="text-sm font-semibold text-foreground">Results</h2>
    <dl className="divide-y divide-border/70 border-y border-border/70">
      {rows.map((label) => <div key={label} className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 py-2.5 text-sm"><dt className="text-muted-foreground">{label}</dt><dd className="text-right font-medium tabular-nums text-muted-foreground">—</dd></div>)}
    </dl>
  </Panel>;
}
