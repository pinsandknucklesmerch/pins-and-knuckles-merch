export const surfaceStyles = {
  base: "min-w-0 rounded-[var(--hub-panel-radius)] border border-border/90 bg-card text-card-foreground",
  panel: "p-[var(--hub-card-padding)]",
  compact: "p-[var(--hub-compact-card-padding)]",
  metric: "p-[var(--hub-card-padding)]",
  actionable: "transition-colors hover:border-primary/60 hover:bg-primary/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
  collapsible: "overflow-hidden",
} as const;

export const controlClassName = "hub-control min-w-0 w-full rounded-[var(--hub-control-radius)] border border-input bg-background px-3 py-2 text-sm text-foreground shadow-none outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid=true]:border-destructive aria-[invalid=true]:focus:ring-destructive";

export const nativeControlClassName = "hub-native-control";
export const nativeSelectClassName = "hub-native-select";
export const freeEntryNumberClassName = "hub-free-entry-number";

export const formFieldClassName = "grid min-w-0 gap-[var(--hub-field-space)]";
