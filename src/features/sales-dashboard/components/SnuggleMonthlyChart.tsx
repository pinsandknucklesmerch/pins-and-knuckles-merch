import { Panel } from "@/components/ui/Panel";
import type { SnuggleMonth } from "../server/snuggleProfit";
import { formatSnuggleChartMonth, getSnuggleBarHeight, getSnuggleChartMaxMagnitude, sortSnuggleMonthsChronologically } from "../lib/snuggleChart";

const money = (value: number) => new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(value);

export function SnuggleMonthlyChart({ months }: { months: SnuggleMonth[] }) {
  const chronologicalMonths = sortSnuggleMonthsChronologically(months);
  const maxMagnitude = getSnuggleChartMaxMagnitude(chronologicalMonths);
  const latestIndex = chronologicalMonths.length - 1;

  return <Panel title="Monthly profit">
    <div className="overflow-x-auto pb-1" role="img" aria-label="Monthly Snuggle profit bar chart">
      <div className="flex h-52 min-w-max items-end gap-2 border-b border-border/70 px-1 pt-4 sm:h-64 sm:gap-3">
        {chronologicalMonths.map((month, index) => {
          const label = formatSnuggleChartMonth(month);
          const height = getSnuggleBarHeight(month.total, maxMagnitude);
          return <div key={`${month.year}-${month.month}`} className="grid h-full w-12 grid-rows-[1fr_auto] items-end gap-2 sm:w-14">
            <div className="flex h-full items-end justify-center">
              <button
                type="button"
                title={`${label}: ${money(month.total)}`}
                aria-label={`${label}: ${money(month.total)}`}
                className={`w-8 rounded-t-sm border border-b-0 transition-[height,background-color] hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card sm:w-9 ${index === latestIndex ? "border-primary bg-primary" : "border-muted-foreground/60 bg-muted-foreground/60"}`}
                style={{ height: `${height}%`, minHeight: height > 0 ? "0.25rem" : "0" }}
              />
            </div>
            <span className="whitespace-nowrap text-center text-[0.65rem] text-muted-foreground">{label}</span>
          </div>;
        })}
      </div>
    </div>
  </Panel>;
}
