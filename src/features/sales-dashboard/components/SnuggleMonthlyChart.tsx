import { Panel } from "@/components/ui/Panel";
import type { SnuggleMonth } from "../lib/snuggleProfit";
import { BarChart } from "metricui";
import { buildSnuggleChartData, sortSnuggleMonthsChronologically } from "../lib/snuggleChart";

export function SnuggleMonthlyChart({ months }: { months: SnuggleMonth[] }) {
  const chronologicalMonths = sortSnuggleMonthsChronologically(months);
  const chartData = buildSnuggleChartData(months);

  return <Panel title="Monthly profit" className="overflow-hidden">
    <div className="min-w-0 overflow-x-auto" aria-label="Monthly Snuggle profit bar chart">
      <BarChart
        data={chartData}
        index="month"
        categories={["profit"]}
        format={{ style: "currency", currency: "GBP", compact: false, precision: 0 }}
        height={280}
        enableLabels={chronologicalMonths.length <= 8}
        labelPosition="auto"
        borderRadius={3}
        colors={["hsl(var(--primary))"]}
        animate
        dense
        legend={false}
        classNames={{ root: "min-w-[34rem]" }}
      />
    </div>
  </Panel>;
}
