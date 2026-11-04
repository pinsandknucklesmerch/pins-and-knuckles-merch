"use client";

import { SearchableCombobox } from "@/components/ui/SearchableCombobox";
import { CUSTOM_GARMENT_OPTION, isCustomGarmentId } from "../domain/customGarment.ts";
import type { Garment } from "../domain/types.ts";

type GarmentComboboxProps = {
  garments: Garment[];
  value: string | null;
  onChange: (value: string | null) => void;
  includeCustomGarment?: boolean;
};

function searchText(garment: Garment) {
  return [
    garment.code,
    garment.altCode,
    garment.brandName,
    garment.name,
    garment.colour,
    garment.tags,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function garmentLabel(garment: Garment) {
  if (isCustomGarmentId(garment.id)) return "Custom Garment";
  return `${garment.code} · ${garment.name}${garment.colour ? ` · ${garment.colour}` : ""}`;
}

export function GarmentCombobox({ garments, value, onChange, includeCustomGarment = false }: GarmentComboboxProps) {
  const options = includeCustomGarment
    ? [CUSTOM_GARMENT_OPTION, ...garments]
    : garments;
  const selectedGarment = options.find((garment) => garment.id === value) ?? null;

  return (
    <div className="grid gap-2">
      <label className="text-xs font-medium text-muted-foreground">Garment</label>
      <SearchableCombobox
        items={options}
        value={selectedGarment ? garmentLabel(selectedGarment) : ""}
        selectedKey={value}
        getKey={(garment) => garment.id}
        getSearchText={searchText}
        renderOption={(garment) => <><span className="block truncate font-medium text-foreground">{garmentLabel(garment)}</span>{isCustomGarmentId(garment.id) ? null : <span className="block truncate text-xs text-muted-foreground">{garment.brandName}{garment.altCode ? ` · ${garment.altCode}` : ""}</span>}</>}
        onSelect={(garment) => onChange(garment.id)}
        onValueChange={() => undefined}
        placeholder="Search garments"
        emptyMessage="No garments found"
        ariaLabel="Garment"
        allowManualEntry={false}
      />
    </div>
  );
}
