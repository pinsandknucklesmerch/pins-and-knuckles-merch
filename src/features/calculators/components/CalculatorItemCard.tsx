import { Trash2 } from "lucide-react";
import { Panel } from "@/components/ui/Panel";
import { EditableItemHeading } from "./EditableItemHeading";

type CalculatorItemCardProps = {
  index: number;
  itemLabel: string;
  canRemove: boolean;
  onItemLabelChange: (value: string) => void;
  onItemLabelBlur: (value: string) => void;
  onRemove: () => void;
  children: React.ReactNode;
};

export function CalculatorItemCard({ index, itemLabel, canRemove, onItemLabelChange, onItemLabelBlur, onRemove, children }: CalculatorItemCardProps) {
  return <Panel className="grid min-w-0 content-start gap-4 border-border/90 bg-card">
    <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
      <EditableItemHeading index={index} value={itemLabel} onChange={onItemLabelChange} onBlur={onItemLabelBlur} />
      <button type="button" disabled={!canRemove} onClick={onRemove} className="inline-flex size-8 shrink-0 items-center justify-center rounded-md border border-border text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40" aria-label={`Remove item ${index + 1}`}><Trash2 className="size-4" /></button>
    </div>
    {children}
  </Panel>;
}
