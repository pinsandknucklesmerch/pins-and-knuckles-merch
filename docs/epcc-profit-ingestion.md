# EPCC / NetSuite Profit Ingestion

## Current repository behavior

EPCC/NetSuite is the monthly-profit source from July 2026 onward. The importer
reads the report email, parses the final overall total, reconciles member
subtotals, and writes company/member data through the service-role-only RPC:

`ingest_epcc_monthly_profit_and_members`

The legacy `ingest_epcc_monthly_profit` overload is retired. Do not use it in
new implementation or current operational guidance.

EPCC owns monthly Profit plus member Profit and PK Tax. Its writes deliberately
exclude Monday-owned Quotes Done and Orders Processed fields.

## Credentials

Configure the following only in server-side environments such as `.env.local`
and Vercel. Never prefix them with `NEXT_PUBLIC_`.

```env
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REFRESH_TOKEN=
GMAIL_REPORT_ADDRESS=
SUPABASE_SERVICE_ROLE_KEY=
CRON_SECRET=
```

Gmail access is read-only. The repository does not prove that OAuth consent,
refresh tokens, mailbox access, or deployed values are valid.

## CLI

The importer is dry-run by default:

```bash
npm run import:epcc-profit
npm run import:epcc-profit -- --year 2026 --month 7
npm run import:epcc-profit -- --message-id <gmail-message-id>
npm run import:epcc-profit -- --apply
```

Dry-run fetches/parses/reconciles a report but does not write ingestion or KPI
records. Apply mode passes reconciled member snapshots to the active RPC.

## Scheduled ingestion

`vercel.json` declares:

```text
GET /api/cron/epcc-profit  5 8 * * *  # 08:05 UTC daily
```

The route requires `Authorization: Bearer <CRON_SECRET>`, then runs apply mode.
Repository configuration does not prove that Vercel deployed or executed the
schedule.

## Reconciliation and observability

The importer totals recognised member rows and compares their Profit/PK Tax
totals with the report totals using currency tolerance. A failed reconciliation
does not apply member snapshots.

Cron handlers attempt to write `cron_run_history` records for start, success,
and failure. Stored data includes reporting period, duration, summary, and
sanitized metadata/error text. Developer Diagnostics shows latest and latest
successful runs, and marks a job overdue after its configured schedule plus a
30-minute grace period.

Run history is operational evidence, not a guarantee of Gmail, EPCC, or
database correctness. Query failures or missing rows need remote investigation.

## Production verification

Verify separately:

- Vercel schedule deployment and `CRON_SECRET`.
- Gmail OAuth configuration, mailbox access, sender/subject/report compatibility.
- Supabase service-role permissions, active migration/RPC/RLS state, and recent
  `cron_run_history` rows.
- The intended source ownership: Monday quote/order values remain intact and
  EPCC profit/member values reflect the accepted report.

See [INGESTIONS_AND_CRONS.md](operations/INGESTIONS_AND_CRONS.md) for the
combined Monday/EPCC operations reference.
