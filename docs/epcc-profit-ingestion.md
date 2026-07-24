# EPCC Gmail profit ingestion

The Sales Dashboard uses the final overall `Total` row from the NetSuite report email with subject `Pins Knuckles Profits V2 ALL SALES` and sender `system@sent-via.netsuite.com`. The second total is stored as Monthly Profit. EPCC is authoritative from July 2026 onward; earlier Monday profit is never changed.

## Gmail OAuth setup

Create a Google OAuth client with Gmail read-only access (`https://www.googleapis.com/auth/gmail.readonly`), authorise the report mailbox once, and store its refresh token. Configure these server-only variables in `.env.local` and Vercel; never prefix them with `NEXT_PUBLIC_`:

```env
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REFRESH_TOKEN=
GMAIL_REPORT_ADDRESS=
CRON_SECRET=
```

The privileged database write also requires `SUPABASE_SERVICE_ROLE_KEY`. The Gmail mailbox address belongs in `GMAIL_REPORT_ADDRESS`.

## CLI

The importer is a dry run unless `--apply` is present:

```bash
npm run import:epcc-profit
npm run import:epcc-profit -- --year 2026 --month 7
npm run import:epcc-profit -- --message-id <gmail-message-id>
npm run import:epcc-profit -- --apply
```

Dry runs fetch and parse Gmail but do not create audit records or update KPI data.

## Cron

Vercel calls `GET /api/cron/epcc-profit` daily with `Authorization: Bearer <CRON_SECRET>`. The configured schedule is `0 10 * * *` (10:00 UTC, 10:00 London in winter and 11:00 in summer), deliberately after the expected 09:00 Europe/London report.
