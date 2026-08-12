# Pins Hub — Canonical Project Context

## Authority and verification boundary

This document is the current repository context for Pins Hub. Source code,
`supabase/migrations/`, configuration, `package.json`/`package-lock.json`, and
tests are implementation authority. Planning documents, historical audits, and
Git history are not implementation authority.

Static repository review cannot verify deployed Vercel schedules, remote
Supabase migration/RLS/RPC state, Gmail OAuth, Monday access, environment
variables, production data, or actual cron execution. Those are operational
verification concerns.

## Purpose and stack

Pins Hub is the internal Pins & Knuckles operations application for sales
reporting, garment pricing, commercial invoices, PK Tax allocation, reference
data, access administration, and developer support workflows. The legacy Hub
is reference-only for confirmed business rules; Prisma, Neon, referrals, and
legacy database architecture are not part of this rebuild.

- Next.js App Router, React 19, TypeScript, Tailwind CSS, and npm.
- Supabase Auth, SSR cookies, database, RLS, forward-only migrations, and
  generated database types.
- `npm run dev` uses Webpack intentionally. `next.config.ts` enables
  `cacheComponents`, hides dev indicators, and permits `192.168.3.34` as a
  development origin.
- The repository contains 33 forward-only migrations, from
  `20260709120000_foundation_auth_access.sql` through
  `20260811110000_retire_legacy_epcc_profit_ingestion_rpc.sql`.

## Routes and features

- Auth: `/`, `/login`, `/auth/confirm`, `/auth/error`, `/auth/forgot-password`,
  `/auth/invite`, and `/auth/update-password`.
- Hub: `/hub`, `/hub/profile`, `/hub/team`, `/hub/team/add`, and
  `/hub/team/[membershipId]`.
- Sales: `/hub/sales-dashboard` and `/hub/sales-dashboard/tv/settings`.
- Calculators: EU Standard, EU US Clients, and UK Trade routes under
  `/hub/calculators`.
- Operations: `/hub/pk-tax`, `/hub/commercial-invoices`, and Data Management
  for Garments, Product Types, and Invoice Companies.
- Developer: `/hub/developer`, `/hub/developer/feedback`, and
  `/hub/developer/diagnostics`.
- Scheduled handlers: `GET /api/cron/epcc-profit` and
  `GET /api/cron/monday-sales-sync`.

Hub navigation is compact and operational. Pages should remain thin; data
access, mappings, calculations, and integrations belong in feature data,
domain, lib, and server modules. Initial loading is generally server-side;
interactive forms, calculators, exports, TV mode, and preferences are client
components.

## Authentication, access, and user management

- Browser code uses the publishable Supabase client; server components use an
  SSR-cookie client; `src/lib/supabase/admin.ts` is `server-only` and uses
  `SUPABASE_SERVICE_ROLE_KEY` for privileged operations.
- The request proxy refreshes sessions and redirects unauthenticated protected
  routes to login. `AppShell` denies UI rendering without active Pins Hub
  access.
- Organisation roles are `owner`, `admin`, `manager`, `staff`, and `viewer`.
  Pins Hub levels are `read`, `write`, `admin`, and `developer`, in ascending
  hierarchy. Owners receive effective admin management access; owners and
  developers can use Developer/User Access Management functions.
- Access resolution requires an authenticated profile, active membership, and
  `pins_hub` app-access record. Foundation and feature migrations enable RLS;
  the remote policy state must still be verified operationally.
- User Access Management provisions profiles, memberships, and app access
  through server-only Admin API calls. It updates profile/Auth display names,
  organisation role, activity state, access level, and a unique canonical
  Monday member ID. The last active owner cannot be deactivated or demoted.
- Invitations use Supabase Auth. Existing users are updated rather than
  duplicated; invite/resend and password-reset delivery require configured
  remote Auth and a safe site URL. `last_active_at` is throttled and is not an
  audit history.

## Sales Dashboard and metric ownership

Detailed developer references: [Sales Dashboard](../reference/SALES_DASHBOARD.md),
[Calculators](../reference/CALCULATORS.md),
[Database schema](../reference/DATABASE_SCHEMA.md), and
[ingestion/cron operations](../operations/INGESTIONS_AND_CRONS.md). Database
tooling is documented in
[DATABASE_BACKUP_RESTORE.md](../operations/DATABASE_BACKUP_RESTORE.md).

The dashboard is Supabase-first: page rendering loads persisted company/member
KPIs, targets, final values, trends, TV settings, and available years through
feature repositories. It does not call Monday during page rendering.

- Views: Overview, YTD, Year Comparison, Snuggle, and Team Members.
- Admins manage targets and independent final-value overrides for Profit,
  PK Tax, Quotes Done, and Orders Processed. Overrides are display values and
  do not overwrite source-owned KPI fields.
- Dashboard and profile member-performance reads prefer organisation rows,
  then global rows, with an intentionally retained historical workbook fixture
  fallback for missing/unavailable periods.
- Dashboard exports use current feature/shared UI components; TV mode rotates
  configured slides and settings are admin-only.

Source ownership is deliberate:

- Monday owns Quotes Done, Orders Processed, Monday snapshot metadata, and
  related member quote/order fields. From July 2026 its payload deliberately
  omits profit-owned fields.
- EPCC/NetSuite owns monthly Profit plus member Profit and PK Tax from July
  2026. Its member payload deliberately omits Monday-owned quote/order fields.
- No source may overwrite fields owned by another source.

## Monday, EPCC, cron history, and diagnostics

`vercel.json` declares daily UTC schedules:

- EPCC profit: `5 8 * * *` (08:05 UTC).
- Monday sales sync: `15 8 * * *` (08:15 UTC).

Both handlers require `Authorization: Bearer <CRON_SECRET>`.

- Monday sync runs for the current UTC reporting month, uses the canonical
  Pins & Knuckles organisation scope, validates/discovers boards, records
  provenance, completes canonical member rows, and holds a database lock keyed
  by organisation/year/month. Historical CLI apply is bounded and requires
  review/force safeguards.
- EPCC ingestion reads Gmail report mail, parses and reconciles company/member
  totals, handles duplicate/older reports, and defaults to dry-run from the
  CLI. Its active ingestion RPC is
  `ingest_epcc_monthly_profit_and_members`. The legacy
  `ingest_epcc_monthly_profit` overload is retired and is not current behavior.
- `cron_run_history` records running/success/failed state, reporting period,
  duration, summaries, and sanitized metadata/errors. Developer Diagnostics
  shows latest/latest-successful runs and calculates overdue status from the
  configured UTC schedule plus a 30-minute grace period.

See [INGESTIONS_AND_CRONS.md](../operations/INGESTIONS_AND_CRONS.md) for the
operator reference and remote-verification checklist.

## Calculators, invoices, PK Tax, and reference data

- EU Standard and EU US Clients are reference-data-driven EUR calculators with
  profiles `EU_STANDARD` and `EU_US_CLIENTS`, garment markups, print and
  embroidery tiers, fees, VAT, optional PK markup, copy output, and separately
  calculated delivery.
- UK Trade is a GBP calculator with a minimum quantity of 50, floor tiers,
  20% VAT, screen/embroidery setup behavior, and quote output.
- EU Trade is intentionally deferred; no active profile or route exists.
- PK Tax is calculation-only and not persisted. It applies fixed allocations,
  a sales/Snuggle pool, weighted recipient allocation, and cent-safe rounding.
- Commercial invoices are in-memory drafts. They validate invoice details and
  line items, use directory defaults, and export XLSX/PDF; there is no invoice
  persistence or history.
- Data Management supplies Garments, Product Types, and Invoice Companies.
  Server actions/RLS enforce write/admin lifecycle rules. `garment_type` is
  transitional; Generic Hoodies remains a temporary fallback pending material
  evidence.

## Feedback, diagnostics, preferences, and database tooling

- Pins Hub users can submit feedback. Owner/developer users manage feedback and
  persisted Snuggle diagnostic issues.
- Animated backgrounds are opt-in through localStorage and disabled when the
  user requests reduced motion.
- `npm run db:backup`, `npm run db:restore`, and `npm run db:test` support
  database operations. Restore rejects production-looking targets, requires
  explicit confirmation, restores public data plus required `auth.users` data,
  and may require `RESTORE_ADMIN_DATABASE_URL` for local auth ownership work.
  Recovery must be proven on a disposable local target.

## Configuration and verification

`.env.example` is the environment-variable contract. Public connection
configuration is `NEXT_PUBLIC_SUPABASE_URL` and
`NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Keep service-role, Monday, Gmail OAuth,
and cron secrets server-only: `SUPABASE_SERVICE_ROLE_KEY`, `MONDAY_API_TOKEN`,
`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN`,
`GMAIL_REPORT_ADDRESS`, and `CRON_SECRET`.

Before code changes, run:

```bash
npm run lint
npx tsc --noEmit
npm run build
```

There is currently no `npm test` script. Test files are present under `src/`
and `scripts/tests/`, but a deterministic documented full-suite command remains
outstanding.

## Outstanding and deferred work

- Add alerting/escalation for failed or overdue ingestion jobs.
- Verify Vercel execution, Gmail OAuth/mailbox access, Monday board/API access,
  service-role privileges, remote migrations/RLS/RPCs, and real cron-history
  persistence.
- Decide the retention/cleanup policy for legacy
  `sales_kpi_profit_email_sources` data.
- Bound or retire the dashboard workbook fallback once KPI persistence coverage
  is confirmed.
- Complete approved calculator/invoice parity and export checks, generic hoodie
  material reconciliation, and remaining garment identity review.
- Add a deterministic full test script.
- Keep EU Trade deferred until business pricing rules are confirmed.
- Reassess the Webpack workaround, hard-coded development origin, and whether
  access checks should happen before dashboard data loading.
