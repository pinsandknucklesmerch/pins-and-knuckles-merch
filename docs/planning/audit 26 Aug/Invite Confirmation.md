# Invite Confirmation

**Route:** `/auth/invite`

## Purpose

Complete an invitation callback and direct the invitee to set a password.

## Current state

* Renders a client callback component that accepts PKCE code or legacy invite fragment, establishes a Supabase session, clears sensitive URL state, and routes to password setup.
* Callback errors or invalid invite state route to the generic auth-error page.

## Issues / unfinished work

* The legacy implicit/fragment support is active compatibility behaviour and is more complex than the standard PKCE path; remote invitation delivery still needs verification.

## Decisions already made

* Clear callback fragments/query state promptly after processing.
* Preserve both supported Supabase callback forms until invitation configuration is deliberately simplified.
* Invitation completion must lead to `/auth/update-password?mode=invite`, not directly to an unauthenticated Hub session.

## Decisions still needed

No material unresolved decisions identified.

## Status

🟡 Needs work — functional compatibility path, with external delivery verification and retained legacy complexity.

