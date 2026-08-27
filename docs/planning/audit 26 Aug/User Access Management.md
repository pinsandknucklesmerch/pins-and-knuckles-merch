# User Access Management

**Route:** `/hub/team`

## Purpose

Admin view of organisation members and their Pins Hub access.

## Current state

* Loads organisation members for `TeamMembersTable`, including membership/access information and best-effort activity display.
* Effective admins only; absence of admin/organisation results in not-found. Owners/developers additionally see Add User.
* Links to user profile/detail pages and uses server-only admin access for membership/provisioning support.

## Issues / unfinished work

* Team loading performs an Admin Auth lookup per membership for sign-in information, which may scale poorly.
* Access and nested Supabase relation mapping use narrow casts; a typed mapper would reduce drift.

## Decisions already made

* Keep organisation role separate from Pins Hub app-access level; owner has effective admin capability.
* Preserve the stronger owner/developer boundary for provisioning and owner/developer access changes.
* Treat `last_active_at` as throttled latest activity, not audit history.

## Decisions still needed

No material unresolved decisions identified.

## Status

🟡 Needs work — access semantics are explicit, with bounded performance/type-safety debt.

