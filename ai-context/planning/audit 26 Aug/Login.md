# Login

**Route:** `/login`

## Purpose

Password sign-in entry point for Pins Hub.

## Current state

* Displays `LoginForm` in the public auth layout; the client uses the publishable Supabase client for password sign-in and then replaces to `/hub`.
* Includes password-recovery navigation and accessible pending/error states.
* The root session proxy redirects authenticated root traffic to Hub and protects Hub routes; actual Hub access still requires membership/app access.

## Issues / unfinished work

No significant current issues identified.

## Decisions already made

* Keep browser auth use limited to the publishable Supabase client and enforce membership/app access server/database-side.
* Preserve the compact public auth presentation and avoid exposing internal Auth errors.

## Decisions still needed

No material unresolved decisions identified.

## Status

✅ Good / stable — straightforward sign-in surface with the intended server-side protection behind it.

