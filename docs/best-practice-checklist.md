# Best Practice Checklist

## Architecture

- Route files compose features and perform route-level redirects only.
- Feature code lives under `src/features/<feature-name>/`.
- Business logic stays out of UI components.
- External API clients stay in server-only data modules.
- Shared UI is reused before adding new component patterns.

## Security

- Supabase Auth and Pins Hub access control are preserved.
- Monday credentials are server-only.
- No tokens use `NEXT_PUBLIC_`.
- No tokens, cookies, keys, or full sessions are logged.
- No public self-sign-up is added.

## UI

- UI remains compact, dark, and operational.
- No unnecessary descriptions, subtitles, helper paragraphs, decorative badges, or marketing sections are added.
- Loading, empty, and error states are included for data surfaces.
- KPI views use reusable cards, tables, filters, and state components.

## Data

- Server components load initial data where practical.
- Mapping and normalisation happen before rendering.
- KPI calculations are pure functions.
- Monday API responses are not passed raw into UI components.
- Dashboard reporting state uses validated year/month route parameters rather
  than the historical date-range filter proposal.
- Supabase is the primary dashboard read source; the historical workbook fixture
  is an explicitly bounded fallback for missing history.
- Monday owns quote/order fields and EPCC owns July-2026-onward profit fields;
  dashboard writes preserve that source isolation.
- Final-value overrides remain separate from calculated/source-owned KPI values.

## Verification

- `npm run lint`
- `npx tsc --noEmit`
- `npm test`
- `npm run build`
- `git diff --check`

> Historical dashboard guidance: date-range, lead-source, and salesperson-table
> architecture from earlier planning is not current project architecture. Keep
> this checklist reusable; use [`PROJECT_CONTEXT.md`](ai-context/PROJECT_CONTEXT.md)
> for current dashboard details.
