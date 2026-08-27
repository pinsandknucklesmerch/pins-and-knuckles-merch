# Pins Hub — Week 3 July Status

> Historical status snapshot from July 2026. Production, deployment, runtime,
> and data assertions below are dated historical claims, not current repository
> verification. The current canonical state is
> [`docs/ai-context/PROJECT_CONTEXT.md`](../ai-context/PROJECT_CONTEXT.md).

> Subsequent resolution: the obsolete EPCC ingestion RPC overload was retired
> remotely, current database types were regenerated on 2026-08-11, and cron
> run history/Developer Diagnostics are implemented. The legacy
> `sales_kpi_profit_email_sources` table remains intentionally retained with
> its historical July 2026 row.

## Status

The Sales/KPI Dashboard is production-ready, pending confirmation of the first unattended cron executions.

## Completed This Week

- Restored green automated tests. The current package manifest does **not**
  define a unified command for the full test suite.
- Updated canonical project documentation.
- Repaired EPCC remote schema drift with forward-only migrations.
- Added the service-role-only EPCC ingestion audit reader.
- Verified calculator production data and Supabase migrations.
- Restored Google OAuth and completed a successful Gmail dry-run.
- Applied July 2026 EPCC monthly profit; confirmed duplicate and stale-report protection.
- Enabled bounded 2026 Monday quote/order persistence.
- Added the `Date In Touch` → `created_at` fallback for blank values.
- Added the secure Monday cron route and database-backed sync locking.
- Verified Vercel environment variables, deployment, and cron registration.

## Production Data Ownership

- Through June 2026, Monday supplies monthly profit.
- From July 2026 onward, EPCC/NetSuite email supplies monthly profit.
- For all periods, Monday supplies quotes done and orders processed.
- Monday must not overwrite EPCC profit from July 2026 onward.

## Current July 2026 Values

- Monthly profit: `116494.08`
- Profit source: `epcc_email`
- Quotes done: `249`
- Orders processed: `141`

## Production Schedule

All times are SAST:

- EPCC profit sync: daily at 10:05
- Monday quote/order sync: daily at 10:15

Vercel schedules are stored in UTC in `vercel.json`.

## Production Safeguards

- `CRON_SECRET` authentication.
- Service-role-only database operations.
- Monday profit-field isolation from July 2026 onward.
- EPCC duplicate and stale-report handling.
- Monday database-backed concurrency lock.
- Missing `Date In Touch` falls back to `created_at`.
- Malformed reporting dates remain blocking errors.
- Monday and EPCC cron routes fail independently.

## Historical Verification Follow-up

- [ ] Confirm the EPCC cron ran.
- [ ] Confirm the Monday cron ran.
- [ ] Confirm monthly profit remains `116494.08`.
- [ ] Confirm quotes remain `249` unless live Monday data changed.
- [ ] Confirm orders remain `141` unless live Monday data changed.
- [ ] Confirm no authentication, OAuth, board-selection, or lock errors.
- [ ] Confirm ingestion/sync audit metadata was recorded.

## Deferred Work

- Higher-frequency Monday sync.
- Monday board rollover handling.
- Failure alerts and operational notifications.
- Audit-retention policy.
- Live user RLS checks.
- Final retention/cleanup decision for `sales_kpi_profit_email_sources` (the
  obsolete RPC overload is retired; the table remains intentionally retained).
- Mobile navigation.
- Garment Directory scope.
- Quick Reference scope.
- EU Trade calculator remains deferred.

## Recommended Next Feature Batch

1. Mobile navigation and Hub usability.
2. Garment Directory scope decision.
3. UI consistency review.
4. Operational alerting after cron stability is confirmed.
