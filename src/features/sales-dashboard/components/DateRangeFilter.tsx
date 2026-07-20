import { DASHBOARD_MONTHS, type DashboardMonth, type DateRange } from "../types";

type DateRangeFilterProps = {
  dateRange: DateRange;
  invalid?: boolean;
  year: number;
  month: DashboardMonth;
  years: number[];
};

export function DateRangeFilter({ dateRange, invalid = false, year, month, years }: DateRangeFilterProps) {
  return (
    <form className="flex flex-wrap items-end gap-3" method="get" aria-describedby={invalid ? "date-range-error" : undefined}>
      <label className="grid gap-1 text-xs font-medium text-muted-foreground">
        Year
        <select name="year" defaultValue={year} className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/35">
          {years.map((option) => <option key={option} value={option}>{option}</option>)}
        </select>
      </label>
      <label className="grid gap-1 text-xs font-medium text-muted-foreground">
        Month
        <select name="month" defaultValue={month} className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/35">
          {DASHBOARD_MONTHS.map((option) => <option key={option} value={option}>{option}</option>)}
        </select>
      </label>
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
      {invalid ? <span id="date-range-error" role="alert" className="basis-full text-xs text-destructive">Invalid date range</span> : null}
    </form>
  );
}
