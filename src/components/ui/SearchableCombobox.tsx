"use client";

import { Check, ChevronDown, X } from "lucide-react";
import { createPortal } from "react-dom";
import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { controlClassName } from "./styles";

export type SearchableComboboxProps<T> = {
  items: T[];
  value: string;
  selectedKey?: string | null;
  getKey: (item: T) => string;
  getSearchText: (item: T) => string;
  renderOption: (item: T, isSelected: boolean) => ReactNode;
  onSelect: (item: T) => void;
  onValueChange?: (value: string) => void;
  onClear?: () => void;
  placeholder: string;
  emptyMessage: string;
  ariaLabel: string;
  disabled?: boolean;
  allowManualEntry?: boolean;
};

export function SearchableCombobox<T>({
  items,
  value,
  selectedKey = null,
  getKey,
  getSearchText,
  renderOption,
  onSelect,
  onValueChange,
  onClear,
  placeholder,
  emptyMessage,
  ariaLabel,
  disabled = false,
  allowManualEntry = true,
}: SearchableComboboxProps<T>) {
  const listboxId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const [menuPosition, setMenuPosition] = useState<{ left: number; top: number; width: number; maxHeight: number } | null>(null);

  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    if (!normalizedQuery) return items;
    return items.filter((item) =>
      getSearchText(item).toLowerCase().includes(normalizedQuery),
    );
  }, [getSearchText, items, query]);

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node) && !menuRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
        setQuery("");
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  useEffect(() => {
    setHighlightedIndex((index) =>
      Math.min(index, Math.max(filteredItems.length - 1, 0)),
    );
  }, [filteredItems.length]);

  useEffect(() => {
    if (!isOpen) {
      setMenuPosition(null);
      return;
    }

    const updatePosition = () => {
      const input = inputRef.current;
      if (!input) return;
      const rect = input.getBoundingClientRect();
      const viewportPadding = 8;
      const gap = 6;
      const width = Math.min(rect.width, Math.max(window.innerWidth - viewportPadding * 2, 0));
      const left = Math.min(
        Math.max(rect.left, viewportPadding),
        Math.max(window.innerWidth - width - viewportPadding, viewportPadding),
      );
      const below = Math.max(window.innerHeight - rect.bottom - gap - viewportPadding, 0);
      const above = Math.max(rect.top - gap - viewportPadding, 0);
      const openAbove = below < 160 && above > below;
      const maxHeight = Math.max(48, Math.min(256, openAbove ? above : below));
      const preferredTop = openAbove ? rect.top - gap - maxHeight : rect.bottom + gap;
      const top = Math.min(
        Math.max(preferredTop, viewportPadding),
        Math.max(window.innerHeight - maxHeight - viewportPadding, viewportPadding),
      );
      setMenuPosition({ left, top, width, maxHeight });
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [isOpen]);

  function openList() {
    if (disabled) return;
    setIsOpen(true);
    setQuery("");
  }

  function selectItem(item: T) {
    onSelect(item);
    setQuery("");
    setIsOpen(false);
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (!isOpen) openList();
      setHighlightedIndex((index) =>
        Math.min(index + 1, Math.max(filteredItems.length - 1, 0)),
      );
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlightedIndex((index) => Math.max(index - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      const item = filteredItems[highlightedIndex];
      if (isOpen && item) selectItem(item);
    } else if (event.key === "Escape") {
      event.preventDefault();
      setIsOpen(false);
      setQuery("");
    }
  }

  const inputValue = query || value;

  return (
    <div ref={rootRef} className="relative min-w-0">
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          className={cn(controlClassName, "h-9 px-2.5 pr-16")}
          placeholder={placeholder}
          value={inputValue}
          disabled={disabled}
          role="combobox"
          aria-label={ariaLabel}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-controls={isOpen ? listboxId : undefined}
          aria-autocomplete="list"
          aria-activedescendant={
            isOpen && filteredItems[highlightedIndex]
              ? `${listboxId}-${getKey(filteredItems[highlightedIndex])}`
              : undefined
          }
          onFocus={(event) => {
            openList();
            event.currentTarget.select();
          }}
          onChange={(event) => {
            const nextValue = event.target.value;
            setQuery(nextValue);
            setHighlightedIndex(0);
            setIsOpen(true);
            if (allowManualEntry) onValueChange?.(nextValue);
          }}
          onKeyDown={handleKeyDown}
        />
        {allowManualEntry && (inputValue || onClear) ? (
          <button
            type="button"
            aria-label={`Clear ${ariaLabel}`}
            disabled={disabled || !inputValue}
            className="absolute right-7 top-1/2 inline-flex size-6 -translate-y-1/2 items-center justify-center rounded text-muted-foreground hover:bg-secondary hover:text-foreground disabled:pointer-events-none disabled:opacity-0"
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => {
              setQuery("");
              onClear?.();
              inputRef.current?.focus();
            }}
          >
            <X className="size-3.5" aria-hidden="true" />
          </button>
        ) : null}
        <ChevronDown
          className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
      </div>

      {isOpen && menuPosition ? createPortal(
        <div
          ref={menuRef}
          id={listboxId}
          role="listbox"
          style={{ left: menuPosition.left, top: menuPosition.top, width: menuPosition.width, maxHeight: menuPosition.maxHeight }}
          className="fixed z-40 overflow-y-auto rounded-md border border-border bg-popover p-1 text-popover-foreground shadow-lg"
        >
          {filteredItems.length > 0 ? (
            filteredItems.map((item, index) => {
              const key = getKey(item);
              const isSelected = key === selectedKey;
              return (
                <button
                  key={key}
                  id={`${listboxId}-${key}`}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  className={`grid w-full grid-cols-[1fr_auto] items-center gap-3 rounded-sm px-2 py-2 text-left text-sm outline-none transition-colors ${index === highlightedIndex ? "bg-secondary" : "hover:bg-secondary/70"}`}
                  onMouseDown={(event) => event.preventDefault()}
                  onClick={() => selectItem(item)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                >
                  <span className="min-w-0">{renderOption(item, isSelected)}</span>
                  {isSelected ? (
                    <Check className="size-4 text-primary" aria-hidden="true" />
                  ) : null}
                </button>
              );
            })
          ) : (
            <div className="px-2 py-3 text-sm text-muted-foreground">
              {emptyMessage}
            </div>
          )}
        </div>,
        rootRef.current?.closest("dialog") ?? document.body,
      ) : null}
    </div>
  );
}
