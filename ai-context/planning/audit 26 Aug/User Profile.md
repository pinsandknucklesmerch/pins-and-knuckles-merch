# User Profile

**Route:** `/hub/team/[membershipId]`

## Purpose

Admin read-only view of an individual organisation member’s account summary and performance.

## Current state

* Resolves the requested membership through `getAdminProfilePerformance` and shows `ProfileAccountSummary` plus the shared `ProfilePerformanceSection`.
* Requires effective admin access; unauthorised or missing subjects return not-found.
* Reuses the same member-performance source/model as Profile and Sales Dashboard rather than recalculating KPIs.

## Issues / unfinished work

* Historical member performance retains the dashboard fallback limitation when persisted periods are absent.

## Decisions already made

* Keep this page an admin detail view, not a second user-editing workflow.
* Future KPI display changes should reuse shared member-performance logic and preserve organisation access checks.

## Decisions still needed

No material unresolved decisions identified.

## Status

✅ Good / stable — a focused admin view that correctly reuses profile-performance logic.

