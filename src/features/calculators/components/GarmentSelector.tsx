"use client";

import { useMemo, useState } from "react";
import type { Garment } from "../domain/types.ts";

type GarmentSelectorProps = {
  garments: Garment[];
  value: string | null;
  onChange: (value: string | null) => void;
};

function garmentSearchText(garment: Garment) {
  return [
    garment.code,
    garment.altCode,
    garment.brandName,
    garment.name,
    garment.colour,
    garment.tags,
  ]
    .join(" ")
    .toLowerCase();
}

export function GarmentSelector({
  garments,
  value,
  onChange,
}: GarmentSelectorProps) {
  const [query, setQuery] = useState("");
  const filteredGarments = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) {
      return garments;
    }

    return garments.filter((garment) =>
      garmentSearchText(garment).includes(normalizedQuery),
    );
  }, [garments, query]);

  return (
    <div className="grid gap-2">
      <label className="text-xs font-medium text-muted-foreground">Garment</label>
      <input
        className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-ring"
        placeholder="Search garments"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
      <select
        className="h-9 rounded-md border border-input bg-background px-3 text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring"
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value || null)}
      >
        <option value="">Select garment</option>
        {filteredGarments.map((garment) => (
          <option key={garment.id} value={garment.id}>
            {garment.code} · {garment.brandName} · {garment.name}
            {garment.colour ? ` · ${garment.colour}` : ""}
          </option>
        ))}
      </select>
    </div>
  );
}
