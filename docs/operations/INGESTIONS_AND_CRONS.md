# Pins Hub — Ingestions and Cron Operations

## Overview

Pins Hub has two scheduled ingestion jobs:

- EPCC / NetSuite monthly profit ingestion
- Monday sales synchronization

Both jobs are server-only and require cron authentication.

## Schedules

Defined in `vercel.json`:

- EPCC: `5 8 * * *` — 08:05 UTC daily
- Monday: `15 8 * * *` — 08:15 UTC daily

Repository configuration does not prove that Vercel deployed or executed these schedules.

## Authentication

Both routes require:

`Authorization: Bearer <CRON_SECRET>`

`CRON_SECRET` must remain server-only.

## Source ownership

From July 2026 onward:

### Monday owns

- Quotes Done
- Orders Processed
- Monday snapshot/source metadata

Monday payloads deliberately omit profit-owned fields.

### EPCC / NetSuite owns

- monthly Profit
- member Profit
- member PK Tax

EPCC ingestion deliberately omits Monday-owned quote/order fields.

### Admin Final Values

Final Values are independent display overrides for:

- Profit
- PK Tax
- Quotes Done
- Orders Processed

They do not overwrite source-owned persisted values.

## EPCC ingestion

Current behavior:

- reads NetSuite/EPCC report email through Gmail
- parses and validates report data
- handles duplicate/older reports
- reconciles member totals
- writes company/member data through service-role ingestion
- CLI defaults to dry-run
- cron route applies changes

Active RPC:

`ingest_epcc_monthly_profit_and_members`

Legacy RPC:

`ingest_epcc_monthly_profit`

The legacy overload is retired and must not be used as current documentation or implementation guidance.

## Monday synchronization

Current behavior:

- authenticated scheduled route
- current UTC reporting month only
- canonical Pins & Knuckles organisation scope
- database lock per organisation/year/month
- board discovery/validation
- source metadata
- canonical member completion
- safe historical CLI workflow

## Cron run history

`cron_run_history` stores:

- job name
- running/success/failed status
- reporting period
- duration
- sanitized summary/metadata
- sanitized error details

## Developer Diagnostics

Developer Diagnostics shows:

- latest run
- latest successful run
- overdue state

Overdue status is calculated using the configured schedule plus a 30-minute grace period.

A missing or stale run-history row is an operational signal, not proof of the underlying cause.

## Required remote verification

When diagnosing production behavior, verify:

- Vercel schedule configuration
- `CRON_SECRET`
- Gmail OAuth credentials and mailbox access
- `GMAIL_REPORT_ADDRESS`
- Monday API token
- Monday board IDs/workspace access
- Supabase service-role privileges
- active RPC/policy/migration state
- recent `cron_run_history` rows

## Outstanding operations work

- add operator alerting/escalation for failed or overdue jobs
- confirm run-history retention policy
- confirm remote schedule execution
- resolve legacy `sales_kpi_profit_email_sources` retention/cleanup
