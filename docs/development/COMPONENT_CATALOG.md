# Pins Hub Component Catalog

This is a short routing aid, not a replacement for source inspection.

| Component | Location | Use / constraints |
| --- | --- | --- |
| `ActionButton` | `src/components/ui/ActionButton.tsx` | Standard primary action or link; use **Edit** for a single table-row action. |
| `ActionMenu` | `src/components/ui/ActionMenu.tsx` | Radix menu for grouped actions; use **Manage** for multi-action table rows and retain destructive items. |
| `Input`, `NumberInput`, `Textarea` | `src/components/ui/Input.tsx` | Standard text, numeric, and multiline controls. |
| `Select` | `src/components/ui/Select.tsx` | Accessible Radix select, including dialog-safe portal behavior. |
| `SearchableCombobox` | `src/components/ui/SearchableCombobox.tsx` | Searchable, keyboard-accessible selector; supply the required accessible labels and item mapping. |
| `FormField` | `src/components/ui/FormField.tsx` | Associates a label and validation error with a single control. |
| `Surface`, `Panel` | `src/components/ui/Surface.tsx`, `Panel.tsx` | Standard panels/surfaces; select a focused existing variant. |
| `Dialog` | `src/components/ui/Dialog.tsx` | Accessible modal with focus restoration; use for confirmations/focused workflows. |
| `CopyableCard` | `src/components/ui/CopyableCard.tsx` | Whole-card copy only when copy is the card’s primary action. |
| `MagicBento` | `src/components/ui/MagicBento.tsx` | Restrained interactive/navigation or KPI cards only; not forms, tables, dialogs, state surfaces, or dense breakdowns. |
| `LoadingState`, `EmptyState`, `ErrorState` | `src/components/ui/*State.tsx` | Standard loading, empty, and error states for data surfaces. |
| Sortable table header | `src/features/data-management/components/GarmentsManager.tsx` | Existing accessibility pattern (`aria-sort`, icon, screen-reader state); extract only when a real shared need is approved. |
