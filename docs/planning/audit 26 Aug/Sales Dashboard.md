# Sales Dashboard

**Route:** `/hub/sales-dashboard`

## Purpose

Operational reporting for company and member sales performance.

## Current state

* Supports URL-backed month/year, Overview, Company Profit, YTD, Snuggle, and Team Members views, plus TV mode and duration query state.
* Reads persisted Supabase KPI rows, targets, final-value overrides, trends, and settings through `loadSalesDashboard`; page requests do not call Monday or Gmail.
* Admins receive current-period cron stale warnings. The client dashboard owns exports, final-value controls, views, and TV interaction.
* Uses shared dashboard domain calculations/presentation helpers, including profit and YTD contracts. All Hub access can view; admin capability enables administrative controls.

## Issues / unfinished work

* The page starts dashboard data loading before `AppShell` renders the access-denied state; RLS remains the security backstop, but an unauthorised request can do avoidable work.
* Historical workbook fallback remains live for missing member/period data; retained intentionally until persisted coverage is confirmed.
* Static source tests cover much of the surface but are brittle; browser/PDF-raster and remote data verification are separate.

## Decisions already made

* Supabase persisted KPI data is the rendering source of truth; Monday/EPCC only ingest through scheduled/server processes.
* Preserve field-level ownership: Monday owns quotes/orders/conversion fields; EPCC owns profit and member profit/PK Tax from July 2026 onward.
* Do not reintroduce prior-year comparison on Overview Monthly Profit; retain current target/shirt presentation and shared gauge contracts.
* Keep month/year route-backed and TV as dashboard query state.

## Decisions still needed

Confirm when persisted KPI coverage permits retiring or bounding the workbook fallback.

## Status

🟡 Needs work — the active reporting architecture is mature, with deliberate fallback and access-ordering debt.

