# Update Password

**Route:** `/auth/update-password`

## Purpose

Set a new password after a verified recovery or invite session.

## Current state

* Server checks for a session before rendering `UpdatePasswordForm`; missing/invalid sessions redirect to auth error.
* Client validation requires matching passwords of at least eight characters, then calls Supabase `updateUser`.
* Recovery signs out and returns to login; invitation mode enters Hub after password setup.

## Issues / unfinished work

* Actual recovery/invitation completion depends on remote Auth email and redirect configuration.

## Decisions already made

* Preserve mode-specific completion: recovery signs out, invite enters Hub.
* Keep session verification server-visible before rendering and retain local validation for password length/match.

## Decisions still needed

No material unresolved decisions identified.

## Status

✅ Good / stable — the recovery and invitation completion paths are deliberately separated.

