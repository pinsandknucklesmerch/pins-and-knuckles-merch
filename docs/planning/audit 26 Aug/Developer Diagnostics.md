# Developer Diagnostics

**Route:** `/hub/developer/diagnostics`

## Purpose

Developer operational view for scheduled-ingestion history and Snuggle data-quality issues.

## Current state

* Displays cron diagnostics from `cron_run_history` and filters persisted diagnostic issues by status, type, month, and detection state.
* Reads Snuggle data, then best-effort synchronises detected warnings into the diagnostic-issues workflow before rendering.
* Requires developer access plus organisation; non-developers redirect to Hub. Data failures use `ErrorState`.

## Issues / unfinished work

* A page render can initiate diagnostic synchronisation, mixing read/display with a best-effort write.
* Cron `success` means the handler did not throw; a business-level rejected Monday sync can still be recorded as success, limiting stale-status interpretation.
* Alerting/escalation and cron-history retention remain unresolved.

## Decisions already made

* Keep run history observational: failure to record it must not prevent source ingestion.
* Preserve sanitized persisted diagnostics and developer-only read access.
* Treat cron warnings as signals, not proof of a root cause; preserve current UTC schedule/grace calculation.

## Decisions still needed

Decide retention/alerting and whether a rejected Monday sync should count as failed/stale.

## Status

🟡 Needs work — useful operational coverage, with deliberate semantics and render-time synchronisation to revisit.

