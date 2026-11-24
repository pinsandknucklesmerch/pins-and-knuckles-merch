# Recovery Confirmation

**Route:** `/auth/recovery-confirm`

## Purpose

Validate a recovery token-hash callback before creating a password-reset session.

## Current state

* Validates token shape, recovery type, and safe local next path server-side before showing a POST-only continue form.
* The verify route calls Supabase OTP verification, creates the session, and proceeds to password update; invalid input redirects to auth error.

## Issues / unfinished work

No significant current issues identified.

## Decisions already made

* Keep recovery verification POST-only and server-mediated.
* Allow only safe local `next` paths; do not permit external redirect targets or client-side token exchange.

## Decisions still needed

No material unresolved decisions identified.

## Status

✅ Good / stable — explicit token validation and server-side session establishment.

