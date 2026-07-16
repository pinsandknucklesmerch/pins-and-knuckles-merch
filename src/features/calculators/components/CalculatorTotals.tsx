import { Panel } from "@/components/ui/Panel";
import type { EuCalculatorTotals } from "../domain/types.ts";

type CalculatorTotalsProps = {
  totals: EuCalculatorTotals;
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "EUR",
  }).format(value);
}

function TotalRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium tabular-nums text-foreground">
        {formatCurrency(value)}
      </dd>
    </div>
  );
}

export function CalculatorTotals({ totals }: CalculatorTotalsProps) {
  return (
    <Panel title="Totals" className="lg:sticky lg:top-4">
      <dl className="space-y-3 text-sm">
        <TotalRow
          label="Production subtotal excl. VAT"
          value={totals.productionSubtotalExVat}
        />
        <TotalRow
          label="Pins subtotal excl. VAT"
          value={totals.customerSubtotalExVat}
        />
        <TotalRow label="VAT" value={totals.vatAmount} />
        <TotalRow label="Pins total incl. VAT" value={totals.customerTotalIncVat} />
        <div className="border-t border-border pt-3">
          <TotalRow label="Profit" value={totals.profitExVat} />
        </div>
      </dl>
    </Panel>
  );
}
