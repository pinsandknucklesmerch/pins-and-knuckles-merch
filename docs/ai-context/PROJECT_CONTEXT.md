# Pins Hub — Canonical Project Context

Last verified: 2026-10-20

## Purpose and boundaries

Pins Hub is the Pins & Knuckles internal web application for operational reporting, analytics, calculators, commercial invoices, PK Tax, reference-data management, user access, and developer support.

Pins Merch App is a separate Expo/React Native repository. It shares parts of the Supabase backend, especially Merch domain schema and access structures, but this repository contains no Pins Merch mobile routes or application source. Changes to shared schema, authentication, RLS, roles, organisations, access helpers, or Merch domain structures can affect both applications.

Repository contents establish implemented source and migration intent. They do not prove remote deployment state, production data, configured credentials, migration application, or external-service health.

## Current architecture

- Next.js App Router application using TypeScript, React, Tailwind CSS, and Supabase. Dependency versions are defined by `package.json` and the lockfile.
- App routes live under `src/app`; Hub routes use the `(hub)` route group and auth flows use root or `(auth)` routes.
- Feature behavior is primarily owned under `src/features`; shared interface controls live under `src/components/ui`, shared layout under `src/components/layout`, and cross-feature infrastructure under `src/lib`.
- Initial data loading is predominantly server-side. Client components own interaction, browser exports, local calculator/form state, and other browser-only behavior.
- Supabase server clients use SSR cookies. Privileged Admin API, ingestion, and service-role operations are isolated in server-only code.
- Database changes are represented by forward-only SQL migrations in `supabase/migrations`.

`next.config.ts` currently enables Cache Components, disables development indicators, and contains a fixed allowed development origin. The development script explicitly starts Next.js with Webpack.

## Authentication and access

Supabase Auth provides email sign-in, invitation, password recovery, and password update flows. Recovery and invitation callbacks establish SSR-visible sessions before protected pages are entered. The landing-page Microsoft sign-in control is disabled; no Microsoft or SharePoint authentication implementation is present.

Pins Hub authorization combines:

- `profiles`;
- active `organisation_members`;
- `app_access` rows for the `pins_hub` application;
- access levels `read`, `write`, `admin`, and `developer`;
- organisation roles, with an active organisation owner receiving effective Hub admin capability.

Owner or developer status grants developer-area access. User Access Management is admin-visible, while owner/developer capability controls invitations and privileged owner/developer changes. Server actions and database policy/RPC boundaries enforce sensitive mutations; UI visibility is not the authorization boundary. Privileged user provisioning and Auth metadata updates use the server-only Supabase admin client.

## Current feature state

### Sales Dashboard

The Sales Dashboard reads persisted company and member KPI rows, targets, final-value overrides, TV settings, and run diagnostics from Supabase. Page rendering does not call Monday or Gmail directly. Current views include operational overview, company profit, year-to-date, Snuggle, and team-member reporting. Administrators can manage persisted TV slide configuration.

Monday and EPCC data have distinct source ownership in the ingestion code. A retained workbook fixture supplies historical fallback data where persisted coverage is missing; database rows take precedence.

Detailed behavior: [`docs/reference/SALES_DASHBOARD.md`](../reference/SALES_DASHBOARD.md).

### Sales Weekly Checklist (source added 2026-10-13)

`/hub/sales-checklist` uses one persistent organisation-scoped board backed by active
duties, active organisation-user assignments and one status row per duty/staff pair.
Statuses persist until changed or reset; there are no weekly snapshots, effective dates,
history or week navigation. Management changes apply immediately while preserving
statuses for pairs that remain active. Clear All requires confirmation and the database
permits existing admin/developer/owner capability or Johan's explicitly provisioned Auth
UUID. The same idempotent reset operation powers the Monday 09:00
Africa/Johannesburg cron. Sales Dashboard TV Mode reads the same board every 15 seconds;
status-only refreshes preserve pagination and rotation. Checklist migrations must be
applied in order through `20261020100000_simplify_sales_checklist_current_board.sql`;
remote application, Johan's reset identity provisioning and cron deployment remain
unconfirmed. No shared auth/access helpers or Merch policies change.
Details: [Sales Weekly Checklist](../reference/SALES_WEEKLY_CHECKLIST.md).

### Reporting and EPCC reports

Reporting is separated from the operational dashboard:

- `/hub/reporting/epcc` renders and exports the Company Profit PDF using the shared Sales Dashboard calculation pipeline.
- `/hub/reporting/metrics` exports active reporting metrics.
- Organisation-scoped EPCC report templates control presentation and fall back to a code-defined default when persisted configuration is absent or invalid.

Template configuration does not own KPI calculations.

### Analytics

Website Analytics has a server-only GA4 reporting implementation for current and comparison metrics, traffic trends, geography, acquisition, top pages, and traffic investigation. The main page supports 7-, 30-, and 90-day periods. Social Media tabs exist, but Instagram and Facebook remain unconnected empty states.

### Calculators

Four calculator routes are implemented and linked from Hub navigation:

- EU Standard;
- EU US Clients;
- UK Trade;
- UK Standard.

EU Standard, EU US Clients, and UK Trade load Supabase-backed calculator reference data. UK Standard is implemented with its own domain/components and uses the current garment catalogue. Calculator drafts remain client-local rather than persisted.

EU Trade has no active route or calculator profile and remains unsupported until its business rules are supplied. Pricing, validation, calculation, and quote behavior are owned by calculator source and reference data rather than this summary.

Detailed behavior: [`docs/reference/CALCULATORS.md`](../reference/CALCULATORS.md).

### PK Tax

PK Tax is a client-side calculation workflow with domain-owned allocation logic and copyable formatted results. Inputs and results are not persisted by the current feature.

### Commercial Invoices

The Commercial Invoice Generator loads organisation, Invoice Company, and Product Type directory data from Supabase. Drafts are held in memory, previewed in the browser, and exported as XLSX or PDF. The current feature does not persist invoice drafts or export history.

### Data Management

Data Management provides current interfaces and server actions for:

- garments;
- Product Types, including invoice/customs defaults;
- organisation-scoped Invoice Companies.

Access checks distinguish read, write, and admin operations. Garments use soft deactivation; Product Types and Invoice Companies have their established lifecycle rules in current source.

### Quick Reference

Quick Reference reads active organisation-scoped records from Supabase. An admin management route supports record creation, editing, ordering, activation, and removal through the current feature actions. It is not browser-local storage.

### User Access Management

The team area lists and edits organisation memberships and Pins Hub access. It supports invitations, existing-account access updates, invitation resend, password-reset initiation, Monday member linking, active-state changes, and protected owner/developer management. Last-active tracking is a throttled latest-activity marker rather than an audit log.

### Developer and admin tooling

The developer area includes:

- user-submitted feedback management;
- persisted diagnostic issues;
- cron-run diagnostics and stale-data warnings;
- a developer-only GA4 connectivity endpoint;
- database backup, guarded restore, connection-test, ingestion, and import scripts.

Restore tooling is intended for explicitly configured disposable/local targets, not production.

## Integrations

### Monday

The repository contains a Monday GraphQL client, board discovery/audit tooling, guarded historical import tooling, and a scheduled current-period sales sync. The cron implementation validates source data, uses a database lock, writes Monday-owned company/member fields through service-role access, and records best-effort run history.

`vercel.json` declares a daily schedule for `/api/cron/monday-sales-sync`. The repository cannot prove that the schedule is deployed, the token or board configuration is valid, or syncs have run successfully.

### EPCC / Gmail / NetSuite email reports

The repository contains Gmail OAuth code, EPCC/NetSuite report parsing and reconciliation, a dry-run-by-default CLI importer, a service-role ingestion path, and the protected `/api/cron/epcc-profit` handler. Ingestion writes company and member profit data through the current RPC-backed flow and records best-effort run history.

`vercel.json` declares a daily EPCC cron schedule. The repository cannot prove deployed scheduling, OAuth consent, mailbox access, message availability, applied RPCs, or successful production ingestion.

### GA4

GA4 reporting uses Vercel OIDC with Google Workload Identity Federation and a configured service-account identity. There is no source-code fallback to a long-lived service-account key. The repository confirms the integration implementation and required configuration names, not production identity federation, property access, or current data health.

### Microsoft / SharePoint

No Microsoft Graph, SharePoint, OneDrive, or Microsoft authentication integration is implemented. The only Microsoft-facing UI found is a disabled sign-in placeholder on the public landing page.

### Browser document exports

Commercial Invoice and reporting workflows generate their supported files in application/browser code. Calculators and PK Tax expose formatted copy output. Output parity with external business templates remains a business verification concern.

## Database and migrations

As of the verification date, `supabase/migrations` contains 58 versioned SQL migrations, from `20260709120000_foundation_auth_access.sql` through `20261020100000_simplify_sales_checklist_current_board.sql`.

The migration history covers:

- identity, profiles, organisations, memberships, app access, and authorization helpers;
- calculator reference schema and catalogue data;
- Sales Dashboard KPI storage, targets, overrides, TV settings, ingestion, locks, and run history;
- Invoice Company/Product Type directories;
- feedback and diagnostic tooling;
- Quick Reference records;
- the persistent Sales Weekly Checklist board, management, reset permissions, and TV slide;
- Merch operational tables, show inventory counts, Band-first access structures, authorization helpers, RLS/grant cutover, transactional creation, membership/organisation administration, and lifecycle RPCs.

The Band-first Merch work is represented by the September migration sequence and detailed in [`docs/reference/MERCH_BAND_FIRST_FOUNDATION.md`](../reference/MERCH_BAND_FIRST_FOUNDATION.md). No claim is made here that those migrations are applied remotely or that Pins Merch App has completed its corresponding client cutover.

`src/types/database.types.ts` is a generated snapshot used by application code. It is not proof of remote schema state and, at this verification point, does not represent every Band-first object present in migration history. Exact policy, grant, RPC, and table behavior must be read from the migrations; remote availability requires operational verification.

## Runtime and tooling

`package.json` is the command authority. It currently defines scripts for development, production build/start, lint, the Node test suite, database backup/restore/connectivity, EPCC import, Metric UI style generation, and post-install generation.

Current configuration also includes:

- Vercel cron declarations for Monday and EPCC handlers;
- Supabase CLI configuration and migrations;
- TypeScript strict checking with the `@/*` source alias;
- Tailwind/PostCSS styling;
- an `.env.example` contract separating browser-safe Supabase configuration from service-role and integration credentials.

Repository working and verification rules are in the root [`AGENTS.md`](../../AGENTS.md).

## Known technical debt and incomplete areas

- Remote Supabase migration state, policies, grants, RPCs, production data, and the Band-first Pins Merch client rollout are not established by this repository.
- The generated database types do not yet mirror every Band-first migration object.
- Sales Dashboard still retains a historical workbook fixture for gaps in persisted coverage.
- Monday business-level rejected outcomes can complete the handler without being classified as thrown cron failures, limiting what run-history status alone proves.
- Social analytics integrations are not connected.
- Microsoft sign-in and SharePoint/OneDrive integrations are not implemented.
- EU Trade remains intentionally deferred pending confirmed business rules.
- Garment `garment_type` and the Generic Hoodies mapping remain transitional catalogue/pricing structures.
- Business parity of calculator quotes, invoice exports, EPCC reports, and spreadsheet exports cannot be established by source inspection alone.
- `next.config.ts` retains a fixed allowed development origin.

## Historical and superseded guidance

Archived rebuild plans, audits, screenshots, migration analyses, and chat-derived summaries are supporting history only. They do not establish current requirements or deployed state. Prisma, Neon, the legacy Hub architecture, and client-side implicit auth callback approaches are not part of the current implementation.

## Documentation relationships

- Root [`AGENTS.md`](../../AGENTS.md) contains durable repository working rules.
- This file contains the changing, repository-verified current-state snapshot.
- Detailed module and business behavior belongs in `docs/reference/`, `docs/operations/`, and focused feature documentation.
- Current source, migrations, manifests, and configuration override stale documentation when they conflict.
- Generated database types and repository migrations do not independently prove remote deployment state.
