import { Panel } from "@/components/ui/Panel";
import type { SnuggleMonth } from "../lib/snuggleProfit";
import { BarChart } from "metricui";
import { buildSnuggleChartData, sortSnuggleMonthsChronologically } from "../lib/snuggleChart";

export function SnuggleMonthlyChart({ months, tvMode = false }: { months: SnuggleMonth[]; tvMode?: boolean }) {
  const chronologicalMonths = sortSnuggleMonthsChronologically(months);
  const chartData = buildSnuggleChartData(months);

  return <Panel title="Monthly profit" className="overflow-hidden">
    <div className="min-w-0 overflow-x-auto" aria-label="Monthly Snuggle profit bar chart">
      <BarChart
        data={chartData}
        index="month"
        categories={["profit"]}
        format={{ style: "currency", currency: "GBP", compact: false, precision: 0 }}
        // MetricUI has no direct margin prop. A blank x-axis legend opts into
        // its larger internal bottom margin without adding visible axis text.
        xAxisLabel=" "
        height={tvMode ? 340 : 280}
        enableLabels={chronologicalMonths.length <= 8}
        labelPosition="auto"
        borderRadius={3}
        colors={["hsl(var(--primary))"]}
        animate
        dense={false}
        legend={false}
        classNames={{ root: "min-w-[34rem]" }}
      />
    </div>
  </Panel>;
}
