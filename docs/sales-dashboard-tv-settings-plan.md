# Sales Dashboard TV Settings Implementation Plan

> Status: implemented in the repository. The original approval sequence is retained below as a historical plan; it is not a list of unapplied work.

## Current implementation

The repository contains the TV settings migration and RPC migrations, generated
database types, settings repository, server actions, admin route/form, TV
runtime, and focused tests:

- `supabase/migrations/20260804120000_sales_dashboard_tv_settings.sql`
- `supabase/migrations/20260804123000_sales_dashboard_tv_settings_rpc.sql`
- `src/features/sales-dashboard/data/salesDashboardTvSettingsRepository.ts`
- `src/features/sales-dashboard/lib/tvSettings.ts` and `tvMode.ts`
- `src/features/sales-dashboard/actions.ts`
- `src/app/hub/sales-dashboard/tv/settings/page.tsx`
- `src/features/sales-dashboard/components/TvSettingsForm.tsx` and `SalesDashboardTvView.tsx`
- `src/features/sales-dashboard/tests/tvSettings.test.ts` and `tvMode.test.ts`

The repository records implementation and migration files only; remote migration
application status is not asserted here. Current schema/deployment context belongs
in [`PROJECT_CONTEXT.md`](ai-context/PROJECT_CONTEXT.md).

## Historical plan state

Historical plan text: the forward-only migration was described as staged at
`supabase/migrations/20260804120000_sales_dashboard_tv_settings.sql` but has not
been applied. Remote migration state is current through `20260803100000`.

The migration creates organisation-scoped settings for the five registered TV
slides: `overview`, `ytd`, `year_comparison`, `snuggle`, and `team_members`.

## Historical post-approval implementation sequence

1. Apply the migration intentionally with `npx supabase db push`.
2. Regenerate `src/types/database.types.ts` using the project Supabase type
   generation command.
3. Add `src/features/sales-dashboard/server/tvSettings.ts` with:
   - canonical slide registry and labels;
   - 30-second defaults;
   - integer duration validation from 10–300 seconds;
   - duplicate slide/order rejection;
   - normalized enabled ordering;
   - fallback to defaults when the organisation has no rows.
4. Add authenticated server actions for save/reset. Each action will call
   `getCurrentPinsHubAccess()` and require `access_level === "admin"` before
   writing through the SSR Supabase client.
5. Add `/hub/sales-dashboard/tv/settings` as a compact admin-only settings
   surface using local component state only until Save. It will support enable,
   Move Up, Move Down, duration editing, Save, Reset, inline validation, and
   Sonner success feedback.
6. Pass loaded settings from the server dashboard route into TV mode. The TV
   controller will rotate only enabled slides in normalized order, use each
   slide duration, and retain the existing pause, navigation, fullscreen,
   hidden-document, and reduced-motion behavior.
7. Keep dashboard data loading outside slide transitions so changing slides
   does not issue new KPI or Snuggle requests.

## Historical validation and tests

Add focused tests for the registry/defaults, normalization, duration bounds,
duplicate detection, enabled-slide validation, repository fallback, admin-only
actions, reset behavior, and TV rotation timing/pause-resume behavior. Then run
the focused Sales Dashboard/TV suite, lint, TypeScript, build, and
`git diff --check`.

The migration intentionally does not enforce “at least one enabled slide” in
SQL because that rule spans rows. Repository and server-action validation will
enforce it before writes.
