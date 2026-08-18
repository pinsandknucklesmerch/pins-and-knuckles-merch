type CalculatorPositionToggleProps = {
  label: string;
  selected: boolean;
  disabled?: boolean;
  onClick: () => void;
};

export function CalculatorPositionToggle({ label, selected, disabled = false, onClick }: CalculatorPositionToggleProps) {
  return <button type="button" aria-pressed={selected} disabled={disabled} onClick={onClick} className={`min-h-9 rounded-md border px-3 py-1.5 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${selected ? "border-primary bg-primary/15 text-foreground" : "border-border bg-background text-muted-foreground hover:bg-secondary hover:text-foreground"} disabled:cursor-not-allowed disabled:opacity-40`}>{label}</button>;
}
