"use client";

import { Check, ChevronsUpDown } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { Garment } from "../domain/types.ts";

type GarmentComboboxProps = {
  garments: Garment[];
  value: string | null;
  onChange: (value: string | null) => void;
};

const currencyFormatter = new Intl.NumberFormat("en-GB", {
  style: "currency",
  currency: "EUR",
});

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
  return `${garment.code} · ${garment.name}${garment.colour ? ` · ${garment.colour}` : ""}`;
}

export function GarmentCombobox({ garments, value, onChange }: GarmentComboboxProps) {
  const listboxId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const selectedGarment = garments.find((garment) => garment.id === value) ?? null;

  const filteredGarments = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return garments;
    return garments.filter((garment) => searchText(garment).includes(normalizedQuery));
  }, [garments, query]);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
        setQuery("");
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  useEffect(() => {
    setHighlightedIndex((index) => Math.min(index, Math.max(filteredGarments.length - 1, 0)));
  }, [filteredGarments.length]);

  function openList() {
    setIsOpen(true);
    setQuery("");
  }

  function selectGarment(garment: Garment) {
    onChange(garment.id);
    setQuery("");
    setIsOpen(false);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (!isOpen) openList();
      setHighlightedIndex((index) => Math.min(index + 1, Math.max(filteredGarments.length - 1, 0)));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlightedIndex((index) => Math.max(index - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      const garment = filteredGarments[highlightedIndex];
      if (isOpen && garment) selectGarment(garment);
    } else if (event.key === "Escape") {
      event.preventDefault();
      setIsOpen(false);
      setQuery("");
    }
  }

  const inputValue = query || (selectedGarment ? garmentLabel(selectedGarment) : "");

  return (
    <div ref={rootRef} className="relative grid gap-2">
      <label htmlFor={`${listboxId}-input`} className="text-xs font-medium text-muted-foreground">
        Garment
      </label>
      <div className="relative">
        <input
          ref={inputRef}
          id={`${listboxId}-input`}
          className="h-9 w-full rounded-md border border-input bg-background px-3 pr-9 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-ring"
          placeholder="Search garments"
          value={inputValue}
          role="combobox"
          aria-expanded={isOpen}
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-activedescendant={isOpen && filteredGarments[highlightedIndex] ? `${listboxId}-${filteredGarments[highlightedIndex].id}` : undefined}
          onFocus={(event) => {
            openList();
            event.currentTarget.select();
          }}
          onChange={(event) => {
            setQuery(event.target.value);
            setHighlightedIndex(0);
            setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
        />
        <ChevronsUpDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
      </div>

      {isOpen ? (
        <div
          id={listboxId}
          role="listbox"
          className="absolute inset-x-0 top-[4.25rem] z-30 max-h-64 overflow-y-auto rounded-md border border-border bg-popover p-1 shadow-lg"
        >
          {filteredGarments.length > 0 ? (
            filteredGarments.map((garment, index) => (
              <button
                key={garment.id}
                id={`${listboxId}-${garment.id}`}
                type="button"
                role="option"
                aria-selected={garment.id === value}
                className={`grid w-full grid-cols-[1fr_auto] items-center gap-3 rounded-sm px-2 py-2 text-left text-sm outline-none transition-colors ${index === highlightedIndex ? "bg-secondary" : "hover:bg-secondary/70"}`}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => selectGarment(garment)}
                onMouseEnter={() => setHighlightedIndex(index)}
              >
                <span className="min-w-0">
                  <span className="block truncate font-medium text-foreground">{garmentLabel(garment)}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {garment.brandName}{garment.altCode ? ` · ${garment.altCode}` : ""}
                  </span>
                </span>
                <span className="flex items-center gap-2 whitespace-nowrap text-xs text-muted-foreground">
                  {garment.eurBasePrice === null ? "—" : currencyFormatter.format(garment.eurBasePrice)}
                  {garment.id === value ? <Check className="size-4 text-primary" aria-hidden="true" /> : null}
                </span>
              </button>
            ))
          ) : (
            <div className="px-2 py-3 text-sm text-muted-foreground">No garments found</div>
          )}
        </div>
      ) : null}
    </div>
  );
}
