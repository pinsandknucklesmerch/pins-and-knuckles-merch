# Pins Hub UI Standards

These standards describe the implemented Hub visual system. See the [component catalog](COMPONENT_CATALOG.md) before adding UI.

## Reuse first

Before new markup or styles: inspect `src/components/ui`, shared feature components, and an existing instance of the interaction. Reuse or extend it where appropriate. Do not make page-specific versions of established controls for minor visual differences.

## Tables

- Put row actions in the first, left-most column.
- Use `ActionButton` with the label **Edit** for one primary row action. Use `ActionMenu` with **Manage** only for genuinely multiple actions.
- Reuse shared dropdown/menu primitives; preserve destructive colour treatment and confirmation flows.
- Use the established sortable-header pattern: `aria-sort`, visible active/inactive sort icons, and screen-reader sort state. Do not invent per-table sort controls.
- Preserve accessible labels, keyboard operation, responsive horizontal overflow, and clear empty states.

## Controls and feedback

- Use `ActionButton` for primary actions and `ActionMenu` for grouped actions. Keep controls at the established compact height and preserve focus, disabled, pending, and destructive states.
- Use `Input`, `NumberInput`, `Textarea`, `Select`, `SearchableCombobox`, and `FormField` where they fit. Native controls must use the shared `hub-native-*` styling; use `Select` rather than a direct `<select>` when its behavior is suitable.
- Use searchable selectors for larger/filterable sets, retaining labels, clear behavior, keyboard navigation, and portal-safe menus.
- Use `Surface`/`Panel` for panels and surfaces; use `Dialog` for confirmation or focused workflows. Do not create competing modal or card treatments.
- Use `CopyableCard` only when copying is the card’s primary action; cards with competing actions must not be wholly clickable. Use `MagicBento` only for navigation, actionable, KPI/metric, or interaction-benefiting result cards—not forms, tables, dialogs, state surfaces, or dense breakdowns—and keep its motion restrained and reduced-motion-safe.
- Use `LoadingState`, `EmptyState`, and `ErrorState` (or an established feature equivalent) for data surfaces. Display validation next to its field and make errors programmatically associated with the input.

## Interface language

The Hub is compact, dark, and operational. Use the existing theme tokens, control radii, spacing variables, alignment, and responsive layouts. Preserve visible keyboard focus and reduced-motion behavior.

Do not add descriptive/helper/subtitle text unless explicitly requested or functionally necessary. Do not add decorative pills or badges (for example, `Coming Soon` or `Spike`) unless they represent real operational state. Do not show application version labels such as `V2`. Utility and scanability outrank decoration; preserve the existing visual language rather than adding one-off styling.
