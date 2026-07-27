"use client";

import { Plus } from "lucide-react";
import { useMemo, useState } from "react";
import { ActionButton } from "@/components/ui/ActionButton";
import { createDefaultEuCalculatorItem } from "../domain/euCalculatorDefaults.ts";
import { calculateEuStandardPrice } from "../domain/euPricingEngine.ts";
import type {
  CalculatorReferenceData,
  CalculatorValidationError,
  EuCalculatorItemInput,
  EuCalculatorTotals,
} from "../domain/types.ts";
import { EuItemCard } from "./EuItemCard";
import { EuCalculatorResults } from "./EuCalculatorResults";
import type { EuQuoteLine } from "../domain/euQuoteFormatter.ts";
import { formatEuStandardQuote, formatUsClientQuote } from "../domain/euQuoteFormatter.ts";

type EuCalculatorProps = {
  referenceData: CalculatorReferenceData;
  profileCode?: "EU_STANDARD" | "EU_US_CLIENTS";
};

type ItemCalculation = {
  itemId: string;
  errors: CalculatorValidationError[];
  totals: EuCalculatorTotals | null;
  result: EuQuoteLine["result"] | null;
};

function emptyTotals(vatRate: number): EuCalculatorTotals {
  return {
    productionSubtotalExVat: 0,
    customerSubtotalExVat: 0,
    vatRate,
    vatAmount: 0,
    customerTotalIncVat: 0,
    profitExVat: 0,
  };
}

function addTotals(
  current: EuCalculatorTotals,
  next: EuCalculatorTotals,
): EuCalculatorTotals {
  return {
    productionSubtotalExVat:
      current.productionSubtotalExVat + next.productionSubtotalExVat,
    customerSubtotalExVat:
      current.customerSubtotalExVat + next.customerSubtotalExVat,
    vatRate: current.vatRate,
    vatAmount: current.vatAmount + next.vatAmount,
    customerTotalIncVat: current.customerTotalIncVat + next.customerTotalIncVat,
    profitExVat: current.profitExVat + next.profitExVat,
  };
}

export function EuCalculator({ referenceData, profileCode = "EU_STANDARD" }: EuCalculatorProps) {
  const [nextItemIndex, setNextItemIndex] = useState(2);
  const [items, setItems] = useState<EuCalculatorItemInput[]>([
    createDefaultEuCalculatorItem(1),
  ]);

  const calculations = useMemo<ItemCalculation[]>(() => {
    return items.map((item) => {
      const result = calculateEuStandardPrice(
        {
          profileCode,
          items: [item],
        },
        referenceData,
      );

      return result.ok
        ? {
            itemId: item.id,
            errors: result.errors,
            totals: result.totals,
            result: result.items[0] ?? null,
          }
        : { itemId: item.id, errors: result.errors, totals: null, result: null };
    });
  }, [items, profileCode, referenceData]);

  const totals = calculations.reduce(
    (current, calculation) =>
      calculation.totals ? addTotals(current, calculation.totals) : current,
    emptyTotals(referenceData.profile.vatRate ?? 0),
  );

  const validItemCount = calculations.filter(
    (calculation) => calculation.totals,
  ).length;

  const validQuoteLines: EuQuoteLine[] = calculations.flatMap((calculation) => {
    if (!calculation.result) return [];
    const input = items.find((item) => item.id === calculation.itemId);
    const garment = referenceData.garments.find(
      (candidate) => candidate.id === calculation.result?.garmentId,
    );
    if (!input || !garment) return [];
    return [{ input, result: calculation.result, garment }];
  });

  function updateItem(updatedItem: EuCalculatorItemInput) {
    setItems((currentItems) =>
      currentItems.map((item) =>
        item.id === updatedItem.id ? updatedItem : item,
      ),
    );
  }

  function addItem() {
    setItems((currentItems) => [...currentItems, createDefaultEuCalculatorItem(nextItemIndex)]);
    setNextItemIndex((currentIndex) => currentIndex + 1);
  }

  function removeItem(itemId: string) {
    setItems((currentItems) =>
      currentItems.length === 1
        ? currentItems
        : currentItems.filter((item) => item.id !== itemId),
    );
  }

  function reset() {
    setItems([createDefaultEuCalculatorItem(1)]);
    setNextItemIndex(2);
  }

  return (
    <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
      <div className="grid min-w-0 gap-4">
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm text-muted-foreground">
            {validItemCount} valid / {items.length} total
          </div>
          <ActionButton onClick={addItem}>
            <Plus className="mr-2 size-4" />
            Add item
          </ActionButton>
        </div>

        <div className="grid gap-4">
          {items.map((item, index) => (
            <EuItemCard
              key={item.id}
              item={item}
              index={index}
              garments={referenceData.garments}
              errors={
                calculations.find((calculation) => calculation.itemId === item.id)
                  ?.errors ?? []
              }
              canRemove={items.length > 1}
              onChange={updateItem}
              onRemove={() => removeItem(item.id)}
            />
          ))}
        </div>
      </div>

      <div className="grid min-w-0 content-start gap-4">
        <EuCalculatorResults items={validQuoteLines} totals={totals} onReset={reset} quoteFormatter={profileCode === "EU_US_CLIENTS" ? formatUsClientQuote : formatEuStandardQuote} showBreakdown={false} showEmptyState={false} />
      </div>

      <div className="col-span-full min-w-0">
        <EuCalculatorResults items={validQuoteLines} totals={totals} quoteFormatter={profileCode === "EU_US_CLIENTS" ? formatUsClientQuote : formatEuStandardQuote} showSummary={false} />
      </div>
    </div>
  );
}
