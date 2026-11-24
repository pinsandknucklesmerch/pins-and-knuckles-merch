# Forgot Password

**Route:** `/auth/forgot-password`

## Purpose

Request a password-recovery email.

## Current state

* Uses `ForgotPasswordForm` and the publishable client to call the shared `sendPasswordRecoveryEmail` helper.
* The helper sends users to `/auth/confirm?next=/auth/update-password`; the page shows generic success/failure feedback and login navigation.

## Issues / unfinished work

* Actual delivery and allowed redirect URLs depend on remote Supabase Auth/site configuration and are not statically verifiable.

## Decisions already made

* Preserve the SSR confirmation callback as the recovery entry path; do not reintroduce abandoned client-side recovery token exchange.
* Keep errors generic and do not disclose whether an address exists.

## Decisions still needed

No material unresolved decisions identified.

## Status

✅ Good / stable — correct local flow; email delivery remains an external verification concern.

