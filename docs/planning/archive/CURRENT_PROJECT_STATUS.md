# Pins Hub — Current Project Status

## Implemented and repository-verified

- Next.js/Supabase application shell, SSR Auth, RLS migrations, organisation
  roles, and Pins Hub access levels.
- User Access Management, profile updates/activity, and profile/member
  performance.
- Sales Dashboard: persisted KPI data, source isolation, targets, final values,
  exports, TV settings, and historical fixture fallback.
- Monday sync, EPCC/NetSuite ingestion, cron run history, Developer
  Diagnostics, feedback, and Snuggle diagnostic workflows.
- EU Standard, EU US Clients, UK Trade, PK Tax, Commercial Invoices, Garments,
  Product Types, Invoice Companies, and local backup/restore tooling.

## Implemented but requiring operational verification

- Vercel cron execution and `CRON_SECRET` configuration.
- Gmail OAuth/mailbox/report access and Monday API/board access.
- Remote Supabase migrations, RLS/RPC/grants, service-role privileges, and
  persisted cron history.
- Invite/reset email delivery and disposable-target restore/recovery behavior.

## Source ownership

- Monday owns Quotes Done and Orders Processed.
- EPCC/NetSuite owns monthly Profit from July 2026 onward and member Profit/PK
  Tax.
- Final Values are independent display overrides and do not overwrite source
  fields.

## Deferred work

- EU Trade calculator and approved calculator/invoice parity checks.
- Generic hoodie material reconciliation and remaining garment identity review.
- Dashboard workbook fixture retirement and legacy profit-email-source retention
  decision.
- A deterministic full test command.

## Operational follow-up

- Add alerting/escalation for failed or overdue cron jobs.
- Verify deployed schedules, credentials, integrations, and run history.
- Reassess the Webpack workaround, hard-coded development origin, and dashboard
  pre-data access checks.

## Documentation status

`docs/ai-context/PROJECT_CONTEXT.md` is the current canonical context.
Operations guidance belongs in `docs/operations/`; plans, legacy analyses, and
dated audits remain historical records unless explicitly marked current.
