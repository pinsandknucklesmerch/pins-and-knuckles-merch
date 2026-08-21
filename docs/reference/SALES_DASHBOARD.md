# Sales Dashboard Reference

This is a repository-verified implementation reference. The canonical
high-level context is [PROJECT_CONTEXT.md](../ai-context/PROJECT_CONTEXT.md);
ingestion operations are documented in
[INGESTIONS_AND_CRONS.md](../operations/INGESTIONS_AND_CRONS.md).

## Route and page rendering

`/hub/sales-dashboard` accepts `year`, `month`, `dashboardView`, `tv`, and
`duration` query state. Invalid/missing year and month values fall back to the
current server year/month. The route loads `loadSalesDashboard()` and renders
through the Hub shell.

Dashboard page rendering is Supabase-first. It reads persisted KPI data through
`src/features/sales-dashboard/data/salesDashboardRepository.ts`; it does not
directly query Monday or Gmail. Scheduled ingestion and manual operational
scripts fetch external systems, persist validated snapshots, then later page
requests render those persisted rows.

## Persistence model

- `sales_kpi_months`: company KPI months, including quotes, orders, monthly
  profit, source/provenance fields, and notes.
- `sales_kpi_member_months`: per-member KPI months. Monday and EPCC write
  distinct owned fields and metadata to the same member identity row.
- `sales_kpi_targets`: effective-dated KPI targets.
- `sales_kpi_month_final_values`: admin-managed month-final display overrides
  with editor/timestamp metadata.
- `sales_dashboard_tv_settings`: organisation-scoped slide enablement, order,
  and duration settings.

The repository selects organisation rows before global rows where both exist.

## Views and controls

Available views are Overview, Company Profit, YTD, Snuggle, and Team Members.
Year/month controls submit route query state. Admins can manage targets and
month-final values. Exports are generated from the active dashboard data,
including metric exports and a profit-report PDF path.

TV mode is query-state on the dashboard rather than a separate TV route. The
separate `/hub/sales-dashboard/tv/settings` route manages admin-only slide
settings. The configured six slides are Overview, YTD, Year Comparison,
Snuggle, Live Zoo Cam, and Team Members; repository validation requires enabled slides,
valid ordering, and bounded durations.

## Overview KPI presentation

The Monthly Profit card is a compact, full-height peer of Sales Inbox in the
Overview row. It displays the Monthly Profit label, current value, target
progress, and enlarged liquid shirt visual only. It intentionally has no
previous-year comparison, comparison badge, or lower comparison divider.

Quotes Done, Orders Processed, and Conversion Rate use the shared `RevGauge`.
Its red, orange, and green arc bands are equal thirds. The maximum is 150% of
the real target, placing the target marker and label at the start of the green
band (two-thirds of the gauge); the needle remains based on the real current
value against that maximum. Target labels are visually stronger than the other
scale labels. These are presentation conventions only and do not change KPI
calculations, targets, comparisons elsewhere, or source ownership.

## Member and profile performance

Dashboard member KPI rows use canonical member identities. The profile feature
reuses member-performance repository data for the authenticated member; admins
can view a non-owner member profile. This reuse does not create a separate
profile-performance store.

## Source ownership

From July 2026 onward:

- Monday owns Quotes Done and Orders Processed, including their company/member
  provenance.
- EPCC/NetSuite owns monthly Profit.
- EPCC member ingestion owns member Profit and PK Tax.
- Final Values are independent display overrides; they do not overwrite
  source-owned persisted fields.

Monday sync payloads omit EPCC-owned profit fields. EPCC payloads omit
Monday-owned quote/order fields. Source ownership is enforced in write payloads
as well as being a reporting rule.

## Historical fallback and limitations

`workbookFixture.ts` supplies historical company/member data when a persisted
period is missing or dashboard persistence queries fail. This keeps historical
views available but is technical debt: it should be deliberately bounded or
removed only after persisted KPI coverage is verified.

The dashboard route currently starts dashboard data loading before the Hub shell
renders its access-denied result. RLS remains the database boundary, but moving
access checks before feature data loading is a potential hardening/performance
improvement.

## Operational boundary

The repository verifies ingestion code, schedules, locks, and persistence
contracts. It cannot verify Vercel execution, Monday/Gmail credentials and data,
remote Supabase policies/RPCs, or actual persisted production rows.
