<!-- headroom:rtk-instructions -->
# RTK (Rust Token Killer) - Token-Optimized Commands

When running shell commands, **always prefix with `rtk`**. This reduces context
usage by 60-90% with zero behavior change. If rtk has no filter for a command,
it passes through unchanged — so it is always safe to use.

## Key Commands
```bash
# Git (59-80% savings)
rtk git status          rtk git diff            rtk git log

# Files & Search (60-75% savings)
rtk ls <path>           rtk read <file>         rtk grep <pattern>
rtk find <pattern>      rtk diff <file>

# Test (90-99% savings) — shows failures only
rtk pytest tests/       rtk cargo test          rtk test <cmd>

# Build & Lint (80-90% savings) — shows errors only
rtk tsc                 rtk lint                rtk cargo build
rtk prettier --check    rtk mypy                rtk ruff check

# Analysis (70-90% savings)
rtk err <cmd>           rtk log <file>          rtk json <file>
rtk summary <cmd>       rtk deps                rtk env

# GitHub (26-87% savings)
rtk gh pr view <n>      rtk gh run list         rtk gh issue list

# Infrastructure (85% savings)
rtk docker ps           rtk kubectl get         rtk docker logs <c>

# Package managers (70-90% savings)
rtk pip list            rtk pnpm install        rtk npm run <script>
```

## Rules
- In command chains, prefix each segment: `rtk git add . && rtk git commit -m "msg"`
- For debugging, use raw command without rtk prefix
- `rtk proxy <cmd>` runs command without filtering but tracks usage
<!-- /headroom:rtk-instructions -->

## Shared Hub UI

- Reuse existing shared UI components before creating feature-specific equivalents; use shared Surface variants before feature-specific cards.
- Do not add helper text, subtitles, explanatory copy, or descriptive labels unless explicitly requested.
- Optional labels default to empty; never auto-generate or auto-fill them, and do not render empty optional labels.
- Minimise unnecessary whitespace. Use shared spacing, radius, padding, borders, focus, and disabled treatments.
- Use `ActionMenu` for grouped related actions such as export formats; preserve destructive styling and confirmation behaviour for destructive actions.
- Use `CopyableCard` for whole-card copy only when copying is the card's primary action; cards with competing actions must not be fully clickable.
- Use Magic Bento only for navigation, actionable, KPI/metric, or interaction-benefiting result cards. Do not use it for forms, tables, dialogs, loading/error states, or dense breakdowns; keep motion and glow restrained and preserve keyboard and reduced-motion support.
- Native dropdowns/select controls must use the shared Select component.
- Do not use direct form `<select>` elements when the shared Select component is suitable. Searchable comboboxes may remain specialised shared components.
- Editable calculator item names use the shared editable-heading pattern where applicable.
- Sidebar sections with child routes use collapsible navigation groups.

## Data Management tables

- Put the action column first/left-most; never place Edit or Manage actions at the far right.
- Use a standard `Edit` button when a row has one available action. Use the shared `ActionMenu` with a `Manage` trigger when a row has multiple actions (for example Edit, Activate/Deactivate, or Delete).
- Preserve the existing destructive styling and confirmation behaviour for destructive menu actions.
- Reuse shared buttons, menus, dropdowns, tables, and action components. If a new reusable behaviour is needed, extend or add it in the common UI layer instead of duplicating it in a page feature.
- Keep action controls consistently sized, spaced, aligned, and interactive across all Data Management tables.

## Route Structure

- Hub routes remain under `src/app/(hub)/hub/`.
- Auth routes live under `src/app/(auth)/auth/`; their public URLs remain `/auth/*`.
- Route groups do not alter public URLs.
## Feedback Rules

- Operational action feedback uses the shared toast helpers.
- Field and calculation validation remains inline.
- All clipboard actions use the shared clipboard helper and standard copy toasts.
- Successful mutations and exports receive concise success toasts.
- Never show raw internal errors to users.
- Do not duplicate inline and toast feedback for the same operational event.
