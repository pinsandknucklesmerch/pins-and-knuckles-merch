import { Plus } from "lucide-react";
import { ActionButton } from "@/components/ui/ActionButton";

type CalculatorToolbarProps = {
  validItemCount: number;
  totalItemCount: number;
  onAddItem: () => void;
  onReset: () => void;
  showAddItem?: boolean;
};

export function CalculatorToolbar({ validItemCount, totalItemCount, onAddItem, onReset, showAddItem = true }: CalculatorToolbarProps) {
  return <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/70 pb-4">
    <div className="text-sm text-muted-foreground">{validItemCount} valid / {totalItemCount} total</div>
    <div className="flex flex-wrap items-center gap-2">{showAddItem ? <ActionButton onClick={onAddItem}><Plus className="mr-2 size-4" />Add item</ActionButton> : null}<button type="button" onClick={onReset} className="inline-flex h-9 items-center justify-center rounded-md border border-input px-3 text-sm font-medium text-foreground transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Reset</button></div>
  </div>;
}
