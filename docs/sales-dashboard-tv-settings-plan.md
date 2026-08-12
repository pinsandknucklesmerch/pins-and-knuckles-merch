# Historical Sales Dashboard TV Settings Plan

> Implemented historical plan. TV settings and TV mode are implemented in the
> repository; this is not an active implementation plan or task list. Current
> behavior belongs in [`PROJECT_CONTEXT.md`](ai-context/PROJECT_CONTEXT.md).

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

## Historical decision record

The original plan proposed organisation-scoped settings for five slides:
`overview`, `ytd`, `year_comparison`, `snuggle`, and `team_members`. It also
specified admin-only save/reset, normalized enabled ordering, 10–300 second
durations, fallback defaults, and at least one enabled slide. Those decisions
were implemented; the original apply/generation/build steps are intentionally
not retained as outstanding instructions.
