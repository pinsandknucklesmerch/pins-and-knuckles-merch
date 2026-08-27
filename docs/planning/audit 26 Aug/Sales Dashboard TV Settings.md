# Sales Dashboard TV Settings

**Route:** `/hub/sales-dashboard/tv/settings`

## Purpose

Admin configuration for the Sales Dashboard TV slide sequence.

## Current state

* Loads organisation-scoped persisted slide settings and renders `TvSettingsForm`.
* Access requires effective admin capability and an organisation; other users receive Next.js not-found.
* The form is backed by the TV settings repository/RPC contract and controls slide enabled state, order, and duration.

## Issues / unfinished work

* `docs/sales-dashboard-tv-settings-plan.md` is a stale plan that describes the implemented migrations/feature as future work.

## Decisions already made

* Keep TV configuration organisation-scoped and admin-only.
* Preserve persisted slides rather than hard-coding client sequencing; the active schema supports six slides and bounded durations.
* Keep TV display mode on the dashboard route, with settings as a separate privileged page.

## Decisions still needed

No material unresolved decisions identified.

## Status

✅ Good / stable — access and persistence are explicit; the remaining concern is stale planning documentation.

