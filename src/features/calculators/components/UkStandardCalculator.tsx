"use client";

import { useState } from "react";
import { Panel } from "@/components/ui/Panel";
import { Select } from "@/components/ui/Select";
import { CalculatorItemCard } from "./CalculatorItemCard";
import { CalculatorQuantityField } from "./CalculatorQuantityField";
import { CalculatorToolbar } from "./CalculatorToolbar";
import { GarmentCombobox } from "./GarmentCombobox";
import { UkStandardDecorationControls } from "./UkStandardDecorationControls";
import { UkStandardDelivery } from "./UkStandardDelivery";
import { UkStandardResults } from "./UkStandardResults";
import { normaliseUkStandardDecimalInput } from "../domain/ukStandardInteractions.ts";
import type { UkStandardGarmentColour, UkStandardItemDraft, UkStandardReferenceData } from "../domain/ukStandardTypes.ts";

function createItem(index: number): UkStandardItemDraft {
  return { id: `standard-item-${index}`, itemLabel: "", garmentId: null, quantity: "50", garmentColour: "WHITE", printPositions: [{ position: "FRONT", decorationType: "SCREEN_PRINT", colourCount: "1" }], pkTax: "" };
}

export function UkStandardCalculator({ referenceData }: { referenceData: UkStandardReferenceData }) {
  const [items, setItems] = useState([createItem(1)]);
  const [includeDelivery, setIncludeDelivery] = useState(false);
  const [deliveryArea, setDeliveryArea] = useState("");
  const [boxCount, setBoxCount] = useState("1");
  const update = (item: UkStandardItemDraft) => setItems((current) => current.map((entry) => entry.id === item.id ? item : entry));
  const reset = () => { setItems([createItem(1)]); setIncludeDelivery(false); setDeliveryArea(""); setBoxCount("1"); };
  const addItem = () => setItems((current) => [...current, createItem(current.length + 1)]);
  const removeItem = (id: string) => setItems((current) => current.length === 1 ? current : current.filter((item) => item.id !== id));
  const validItemCount = items.filter((item) => item.garmentId && Number(item.quantity) > 0).length;

  return <div className="grid min-w-0 gap-4">
    <CalculatorToolbar validItemCount={validItemCount} totalItemCount={items.length} onAddItem={addItem} onReset={reset} />
    <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(19rem,0.85fr)]">
      <div className="grid min-w-0 content-start gap-4">
        {items.map((item, index) => <CalculatorItemCard key={item.id} index={index} itemLabel={item.itemLabel} canRemove={items.length > 1} onItemLabelChange={(itemLabel) => update({ ...item, itemLabel })} onItemLabelBlur={(itemLabel) => update({ ...item, itemLabel })} onRemove={() => removeItem(item.id)}>
          <div className="grid min-w-0 gap-4 md:grid-cols-[minmax(0,1fr)_140px]"><GarmentCombobox garments={referenceData.garments} value={item.garmentId} onChange={(garmentId) => update({ ...item, garmentId })} /><CalculatorQuantityField type="text" inputMode="numeric" value={item.quantity} onChange={(event) => update({ ...item, quantity: event.target.value.replace(/\D/g, "") })} /></div>
          <div className="grid gap-2 sm:grid-cols-2"><label className="grid gap-1.5 text-xs font-medium text-muted-foreground">Garment colour/type<Select value={item.garmentColour} onValueChange={(garmentColour) => update({ ...item, garmentColour: garmentColour as UkStandardGarmentColour })}><option value="WHITE">White garment</option><option value="COLOURED">Coloured garment</option></Select></label></div>
          <UkStandardDecorationControls value={item.printPositions} onChange={(printPositions) => update({ ...item, printPositions })} />
          <label className="grid gap-1.5 text-xs font-medium text-muted-foreground sm:max-w-[220px]">PK Tax<input className="hub-native-control" type="text" inputMode="decimal" pattern="-?[0-9]*\.?[0-9]*" value={item.pkTax} onChange={(event) => update({ ...item, pkTax: normaliseUkStandardDecimalInput(event.target.value) })} /></label>
        </CalculatorItemCard>)}
        <Panel className="grid gap-3"><h2 className="text-sm font-semibold text-foreground">Delivery</h2><UkStandardDelivery enabled={includeDelivery} area={deliveryArea} boxCount={boxCount} onEnabledChange={setIncludeDelivery} onAreaChange={setDeliveryArea} onBoxCountChange={setBoxCount} /></Panel>
      </div>
      <UkStandardResults />
    </div>
  </div>;
}
