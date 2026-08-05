"use client";

import { useMemo, useState } from "react";
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
import { EuDeliveryHelper } from "./EuDeliveryHelper";
import { CalculatorToolbar } from "./CalculatorToolbar";
import type { EuQuoteLine } from "../domain/euQuoteFormatter.ts";
import { formatEuStandardQuote, formatUsClientQuote } from "../domain/euQuoteFormatter.ts";
import { shouldShowMissingGarmentError } from "../domain/euCalculatorInteractions.ts";
import { Plus } from "lucide-react";
import { ActionButton } from "@/components/ui/ActionButton";

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
  const [includeDeliveryCosts, setIncludeDeliveryCosts] = useState(false);
  const [deliveryCountry, setDeliveryCountry] = useState<string | null>(referenceData.deliveryRates[0]?.country ?? null);
  const [deliveryBoxCount, setDeliveryBoxCount] = useState(1);
  const [deliveryMarkupEnabled, setDeliveryMarkupEnabled] = useState(false);
  const [deliveryMarkupPerBox, setDeliveryMarkupPerBox] = useState(0);
  const [missingGarmentActions, setMissingGarmentActions] = useState<Record<string, { attemptedAddItem?: boolean; attemptedPrintSelection?: boolean }>>({});

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
  const hasValidItems = validItemCount > 0;

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
    if (updatedItem.garmentId) {
      setMissingGarmentActions((current) => {
        const next = { ...current };
        delete next[updatedItem.id];
        return next;
      });
    }
    setItems((currentItems) =>
      currentItems.map((item) =>
        item.id === updatedItem.id ? updatedItem : item,
      ),
    );
  }

  function markPrintPositionSelected(itemId: string) {
    const item = items.find((currentItem) => currentItem.id === itemId);
    if (item?.garmentId) return;
    setMissingGarmentActions((current) => ({
      ...current,
      [itemId]: { ...current[itemId], attemptedPrintSelection: true },
    }));
  }

  function addItem() {
    setMissingGarmentActions((current) => {
      const next = { ...current };
      items.forEach((item) => {
        if (!item.garmentId) {
          next[item.id] = { ...next[item.id], attemptedAddItem: true };
        }
      });
      return next;
    });
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
    setMissingGarmentActions({});
    setIncludeDeliveryCosts(false);
    setDeliveryCountry(referenceData.deliveryRates[0]?.country ?? null);
    setDeliveryBoxCount(1);
    setDeliveryMarkupEnabled(false);
    setDeliveryMarkupPerBox(0);
  }

  return (
    <div className="grid min-w-0 gap-4">
      <CalculatorToolbar validItemCount={validItemCount} totalItemCount={items.length} onAddItem={addItem} onReset={reset} showAddItem={false} />

      <div className="grid min-w-0 gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(20rem,1fr)]">
        <div className="grid min-w-0 content-start gap-4">
          <div className="grid gap-4">
            {items.map((item, index) => <div key={item.id} className="grid min-w-0 gap-3">
              <EuItemCard
                item={item}
                index={index}
                garments={referenceData.garments}
                errors={(calculations.find((calculation) => calculation.itemId === item.id)?.errors ?? []).filter((error) => error.code !== "MISSING_GARMENT" || shouldShowMissingGarmentError({ garmentId: item.garmentId, ...missingGarmentActions[item.id] }))}
                canRemove={items.length > 1}
                onChange={updateItem}
                onRemove={() => removeItem(item.id)}
                onPrintPositionSelect={() => markPrintPositionSelected(item.id)}
              />
            </div>)}
          </div>

          <ActionButton onClick={addItem}><Plus className="mr-2 size-4" />Add item</ActionButton>
          <label className="flex min-w-0 items-center gap-2 text-sm text-foreground">
            <input type="checkbox" checked={includeDeliveryCosts} onChange={(event) => setIncludeDeliveryCosts(event.target.checked)} className="size-4 shrink-0 rounded border-input bg-background accent-primary" />
            <span className="min-w-0 break-words">Include delivery costs</span>
          </label>
          {includeDeliveryCosts ? <EuDeliveryHelper
            deliveryRates={referenceData.deliveryRates}
            deliveryRatesError={referenceData.deliveryRatesError}
            country={deliveryCountry}
            boxCount={deliveryBoxCount}
            markupEnabled={deliveryMarkupEnabled}
            markupPerBox={deliveryMarkupPerBox}
            onCountryChange={setDeliveryCountry}
            onBoxCountChange={setDeliveryBoxCount}
            onMarkupEnabledChange={setDeliveryMarkupEnabled}
            onMarkupPerBoxChange={setDeliveryMarkupPerBox}
          /> : null}
        </div>

        {hasValidItems ? <div className="grid min-w-0 content-start gap-4">
          <EuCalculatorResults items={validQuoteLines} totals={totals} quoteFormatter={profileCode === "EU_US_CLIENTS" ? formatUsClientQuote : formatEuStandardQuote} showEmptyState={false} />
        </div> : null}
      </div>
    </div>
  );
}
