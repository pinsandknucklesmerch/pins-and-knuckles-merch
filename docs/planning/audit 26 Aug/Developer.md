# Developer

**Route:** `/hub/developer`

## Purpose

Developer-only entry point for feedback and operational diagnostics.

## Current state

* Loads open feedback and diagnostic counts and links to the two corresponding inboxes.
* Access uses `hasDeveloperAccess`; unauthorised users are redirected to `/hub`.
* Developer capability is distinct from normal admin visibility and comes from the app-access/owner model.

## Issues / unfinished work

No significant current issues identified.

## Decisions already made

* Keep developer support separate from ordinary Hub administration.
* Use persisted counts, not client-side approximations, for the landing cards.

## Decisions still needed

No material unresolved decisions identified.

## Status

✅ Good / stable — a deliberately narrow, protected developer entry point.

