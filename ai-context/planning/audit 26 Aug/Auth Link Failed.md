# Auth Link Failed

**Route:** `/auth/error`

## Purpose

Safe failure destination for invalid or expired authentication links.

## Current state

* Shows a concise generic failure message and a link back to login.
* Is used by failed confirmation, recovery, and invite callback paths.

## Issues / unfinished work

No significant current issues identified.

## Decisions already made

* Keep failure messaging generic and avoid echoing tokens, provider errors, or link parameters.
* Keep this as a stable common endpoint for authentication callback failures.

## Decisions still needed

No material unresolved decisions identified.

## Status

✅ Good / stable — intentionally minimal and safe error handling.

