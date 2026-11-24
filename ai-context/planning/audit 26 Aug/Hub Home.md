# Hub Home

**Route:** `/hub`

## Purpose

Authenticated landing page for the primary Pins Hub areas.

## Current state

* Renders six navigation cards from shared `hubFeatureNavigation`: Sales Dashboard, Analytics, Calculators, PK Tax, Commercial Invoices, and Data Management.
* Uses `AppShell`, `PageHeader`, and `MagicBento`; the sidebar consumes the same navigation configuration.
* Has no direct business-data query. The Hub layout resolves SSR Supabase access and records throttled last activity.
* An active `pins_hub` membership/access row is required for the shell; unauthenticated Hub requests are redirected by the session proxy. Profile, Team, and Developer are sidebar/account entries rather than cards.

## Issues / unfinished work

* Temporary `/hub` request diagnostics remain in both proxy and page code. The page message says the proxy is unregistered although current source contains a root proxy, so logs can be contradictory or duplicated.
* Diagnostics include request metadata such as `referer` (while deliberately excluding cookies and authorization) and should be removed after the request investigation.

## Decisions already made

* Future changes should keep this page as a launcher, not a duplicate dashboard.
* Continue using `hubFeatureNavigation` as the shared source for primary navigation.
* Keep Profile beside sign-out and keep admin/developer destinations role-gated in the sidebar.
* Preserve the compact dark shell, keyboard navigation, responsive sidebar, and reduced-motion-safe card behaviour.

## Decisions still needed

Confirm the repeated-request cause and remove the temporary diagnostics.

## Status

🟡 Needs work — the launcher is sound, but temporary contradictory instrumentation remains.

