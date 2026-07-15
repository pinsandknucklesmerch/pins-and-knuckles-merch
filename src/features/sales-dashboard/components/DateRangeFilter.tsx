import type { DateRange } from "../types";

type DateRangeFilterProps = {
  dateRange: DateRange;
};

export function DateRangeFilter({ dateRange }: DateRangeFilterProps) {
  return (
    <form className="flex flex-wrap items-end gap-3" method="get">
      <label className="grid gap-1 text-xs font-medium text-muted-foreground">
        From
        <input
          className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/35"
          defaultValue={dateRange.from}
          name="from"
          type="date"
        />
      </label>
      <label className="grid gap-1 text-xs font-medium text-muted-foreground">
        To
        <input
          className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/35"
          defaultValue={dateRange.to}
          name="to"
          type="date"
        />
      </label>
      <button
        className="h-9 rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        type="submit"
      >
        Apply
      </button>
    </form>
  );
}
