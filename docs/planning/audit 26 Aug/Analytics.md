# Analytics

**Route:** `/hub/analytics`

## Purpose

Hub analytics surface for website and social-media reporting.

## Current state

* URL parameters select `website` or `social-media` view and 7/30/90-day website periods through dedicated parsers.
* Website view requests a live GA4 report server-side and presents configuration/unavailable states through `AnalyticsDashboard`.
* GA4 uses server-only Vercel OIDC/Google workload identity integration; reports are not persisted. Any Hub-access user can reach the page.

## Issues / unfinished work

* Social-media/Meta integration is not implemented; the related view is an honest pending/empty state, not live social reporting.
* Live GA4 configuration, identity permissions, and production availability cannot be proven from repository review.

## Decisions already made

* Keep analytics view and period URL-backed using `parseAnalyticsView` and `parseWebsiteAnalyticsPeriod`.
* Website analytics must remain server-only, live, and non-persisted; do not introduce client credentials or invented figures.
* Treat GA4 configuration failure separately from temporary report unavailability.

## Decisions still needed

Decide the approved social/Meta data source, access model, and metrics before implementing that view.

## Status

🟡 Needs work — live website reporting exists, while social reporting is intentionally unfinished.

