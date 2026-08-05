# Pins Hub Rebuild Project Context

This is the canonical project context for the Pins Hub rebuild.

## Project Purpose

Pins Hub is the internal operations platform for Pins & Knuckles merchandise workflows. The rebuild is a clean Next.js/Supabase application for pricing calculators, garment data, PK Tax, commercial invoices, reference data, sales reporting, and future operational tools.

The legacy Hub is reference-only. Use it only to confirm business behaviour and copy contracts. Do not reintroduce Prisma, Neon, referrals, legacy database architecture, or old implementation patterns.

## Rebuild Strategy

- Build feature-by-feature in the new architecture.
- Keep route files thin and move data access, mapping, calculations, and business logic into feature modules.
- Preserve validated calculator behaviour only after it has been confirmed against source and planning docs.
- Prefer explicit, typed domain engines over configurable formulas stored in data.
- Keep Supabase Auth, SSR cookie handling, RLS, migrations, and `pins_hub` access checks intact.

## Current Status Snapshot (2026-08-03)

The repository's current committed revision is `5b2747c` (`Updated Sales Dashbaord layout`). The working tree also contains one uncommitted two-line presentation-only edit in `src/features/sales-dashboard/components/YearToDateView.tsx` (the variance card label changes from `Ahead / Behind` to `Status`); it is not treated as committed project status here.

### Complete and deployed or production-confirmed

- The Next.js App Router rebuild, Supabase Auth/access control, calculator routes and engines, PK Tax calculator, commercial invoice generator, data-management routes, Sales Dashboard data layer, source-isolated ingestion migrations, cron routes, and month-end final-value schema are implemented.
- Production evidence confirms the Supabase migrations through the member-KPI and final-value migrations, the EPCC/Monday cron routes, their `08:05 UTC` / `08:15 UTC` schedules, and the required encrypted production variable names.
- Confirmed company final Profit values are July 2026: **£165,942.07** and December 2025: **£153,931.76**. These are month-end final values; calculated/source-owned profit remains separate.

### Implemented; latest UI revision awaits separate production verification

- The latest committed Sales Dashboard UI has one Overview/YTD/Year Comparison tab row, an admin-only outlined Manage final values action beside Edit Targets, wrapped action controls, source-effective KPI cards, and Leads removed from the comparison selector with a Monthly Profit fallback.
- The formatted monetary final-value editor accepts grouped and currency-prefixed input while retaining server-side validation.

### Planned or outstanding

- Monitor scheduled EPCC/Monday runs and add failure alerts.
- Retain operational audit history for scheduled ingestion outcomes.
- Review the deferred July Monday source delta before any bounded apply; do not apply it automatically.
- Complete final rollout/parity checks before general team release.
- Keep the seven-KPI export expectation current; older local test copies may still expect six KPIs.

Referrals remain explicitly excluded from this rebuild. Prisma and Neon are obsolete-implementation references only, not current stack components.

## Current Tech Stack

- Package manager: npm, with the committed `package-lock.json`.

Installed versions from `package-lock.json`:

- `next` 16.2.10
- `react` 19.2.7
- `react-dom` 19.2.7
- `typescript` 5.9.3
- `tailwindcss` 3.4.19
- `@supabase/ssr` 0.12.0
- `@supabase/supabase-js` 2.110.1
- `supabase` CLI 2.109.1 as a dev dependency

Other active UI/helper packages include Radix checkbox/dropdown/label/slot, `lucide-react`, `next-themes`, `class-variance-authority`, `clsx`, `tailwind-merge`, and `tailwindcss-animate`.

## Development Runtime

- `npm run dev` runs `next dev --webpack`.
- Webpack is required for local development because Turbopack HMR caused repeated reload/request loops.
- `next.config.ts` currently enables `cacheComponents: true`.
- Verification commands are `npm run lint`, `npx tsc --noEmit`, `npm run build`, focused Node tests via `node --experimental-strip-types --test <test-files>`, and `git diff --check`.

## Environment Variables

Required local variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` for the dedicated server-only team-provisioning client
- `MONDAY_API_TOKEN` for the server-only Monday audit/sync CLI
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN`, and `GMAIL_REPORT_ADDRESS` for server-only EPCC Gmail ingestion
- `CRON_SECRET` for the authenticated Vercel EPCC cron route

Optional Monday board-ID overrides are `MONDAY_SALES_BOARD_ID`, `MONDAY_QUOTES_BOARD_ID`, and `MONDAY_ORDERS_BOARD_ID`; board discovery is used when they are unset.

Do not add service-role keys, database URLs, Monday tokens, or other secrets to client code or `NEXT_PUBLIC_` variables.

## Auth And Access

- `/login` uses Supabase email/password auth.
- Auth route files live under `src/app/(auth)/auth/`; `/auth/forgot-password`, `/auth/confirm`, `/auth/update-password`, and `/auth/error` remain their public URLs.
- `proxy.ts` delegates to `src/lib/supabase/proxy.ts` for Supabase SSR cookie handling and root/protected-route redirects.
- `src/lib/supabase/server.ts` creates typed server Supabase clients using SSR cookies.
- `src/lib/access/pinsHubAccess.ts` loads the current profile, organisation membership, and `pins_hub` app access through RLS-backed Supabase table reads.
- `AppShell` protects hub pages and renders `AccessDenied` when the authenticated user lacks `pins_hub` access.

## Supabase Schema State

### Organisation Ownership Rule (remote audit 2026-08-03)

- The canonical Pins organisation is the single `organisations.slug = 'pins-knuckles'` row. Its ID is resolved from that slug at runtime/migration time; do not hardcode it in new migrations.
- `organisation_id IS NULL` is intentional global/default configuration for `calculator_profiles`, `calculator_fees`, `calculator_garment_markups`, `delivery_rates`, `eu_embroidery_pricing`, `eu_print_price_tiers`, `garments`, `uk_trade_embroidery_pricing`, and `uk_trade_print_price_tiers`. Each has a `*_global_only_chk` constraint and matching RLS write policy, so these rows must remain global.
- The four NULL `sales_kpi_targets` rows are the seeded global defaults. Target resolution deliberately applies global targets first and Pins-specific targets second; changing them would remove fallback behaviour. The 2026-08-03 audit found no current same-key collision with Pins-specific target rows, but that does not make the intentional global defaults eligible for backfill.
- Current Pins-owned KPI, member, final-value, ingestion, membership, and lock rows already have the Pins organisation ID. No organisation backfill migration is required as of this audit. Nullable KPI columns remain nullable because the repository still supports scoped/global fallback reads; do not add `NOT NULL` without a separate schema decision.
- `sales_kpi_profit_email_sources` exists remotely but is not represented by a repository migration. It has no NULL organisation rows, but its ownership/retention remains an unrelated schema-drift review item.

Repository migrations:

- `20260709120000_foundation_auth_access.sql`
  - Organisations, profiles, organisation members, app access.
  - RLS helpers and access policies.
  - Auth profile trigger.
- `20260715120000_calculator_schema.sql`
  - Garments.
  - Calculator profiles.
  - Calculator garment markups.
  - Calculator pricing sets and profile-to-pricing-set mappings.
  - EU print tiers and embroidery pricing.
  - UK Trade print and embroidery tables.
  - Calculator fees.
  - Delivery rates.
  - RLS policies for calculator reference data.
- `20260715130000_calculator_seed.sql`
  - Global calculator seed data with `organisation_id = null`.
  - Active profiles for `EU_STANDARD`, `EU_US_CLIENTS`, and `UK_TRADE`.
  - No active EU Trade profile.
- `20260728150000_add_product_types_and_other_category.sql`
  - Global `product_types` reference-data foundation and nullable `garments.product_type_id` staged relationship.
  - `OTHER` calculator pricing category support; no Product Types or OTHER markup values are seeded.
  - `garment_type` remains transitional until legacy garment data is migrated and Product Type pricing categories become authoritative.
- `20260720190000_sales_dashboard_phase1.sql`
  - Persistent company, team-member, and target KPI tables with RLS-backed Pins Hub read/admin-write policies.
- `20260722120000_grant_service_role_team_provisioning.sql`
  - Narrow table privileges for the dedicated service-role team-provisioning flow; RLS remains enabled.
- `20260722130000_add_monday_sales_snapshot_fields.sql`
  - Canonical Monday KPI mapping and JSON audit provenance for monthly KPI snapshots.
- `20260722140000_grant_service_role_monday_sales_sync.sql`
  - Narrow `sales_kpi_months` read/write privileges for the server-only Monday sync CLI; RLS remains enabled.
- `20260722150000_add_monthly_profit_source.sql`
  - Monthly profit source provenance.
- `20260722160000_remove_duplicate_monday_scope_a_fields.sql`
  - Canonical Scope A field cleanup.
- `20260723100000_add_epcc_profit_email_ingestion.sql`
  - EPCC ingestion table and service-role-only RPC.
- `20260728120000_restore_epcc_profit_ingestion.sql`
  - Forward-only restoration of the missing EPCC ingestion table and service-role-only RPC.
- `20260728130000_add_epcc_profit_ingestion_audit_reader.sql`
  - Service-role-only metadata audit RPC for EPCC ingestion reconciliation; it returns no message, sender, subject, or source-hash values.
- `20260728140000_add_monday_sales_sync_lock.sql`
  - Database-backed per-organisation/month lock for scheduled Monday synchronization.
- `20260728150000_add_product_types_and_other_category.sql`
  - Product Types foundation and staged `OTHER` calculator category support.
- `20260728160000_import_product_types_and_ready_garments.sql`
  - Product Type and ready-garment reference data import.
- `20260728170000_add_generic_hoodies_product_type.sql`
  - Generic Hoodies Product Type reference data.
- `20260728180000_normalize_eu_calculator_garment_markups.sql`
  - Normalized EU calculator garment markup data.
- `20260731100000_add_member_kpi_source_isolation.sql`
  - Adds source-isolated member KPI fields, classifications, and the EPCC member-ingestion RPC.
- `20260731110000_backfill_epcc_members_and_grant_monday_member_sync.sql`
  - Safely backfills missing EPCC member fields for an accepted duplicate report and grants the direct member-table rights required by the Monday service-role sync.
- `20260803100000_add_sales_kpi_month_final_values.sql`
  - Adds independent admin-only month-end final values for Profit, PK Tax, Quotes Done, and Orders Processed. Final values are stored separately from source-owned calculated fields with the last editor and timestamp; no calculated values are backfilled or overwritten.

Generated database types are present at `src/types/database.types.ts`.

## Production Database Verification

Verified 2026-07-28 against the linked Supabase project:

- Remote migration history lists every repository migration through `20260728130000_add_epcc_profit_ingestion_audit_reader.sql`.
- Migration history had drifted from schema contents for the original EPCC migration; the most likely cause is a migration recorded from different SQL or later manual object removal. The forward restoration migration recreated the missing ingestion table and RPC without dropping data.
- The EPCC ingestion table has RLS enabled; its RPC is `SECURITY DEFINER`, sets `search_path = public`, and grants execution only to `service_role`.
- Calculator reference data matches the seeded profile/count expectations: EU Standard, EU US Clients, and UK Trade are active; EU Trade has no active profile; no invalid pricing validity windows were found.
- Regenerated remote types still differ from `src/types/database.types.ts` because the remote has an additional `sales_kpi_profit_email_sources` table not represented in repository migrations. Repository types were intentionally not replaced pending separate review of that unrelated drift.
- `sales_kpi_profit_email_sources` is unused by current application code, scripts, RPCs, and documentation, but contains one historical source-metadata row. It is retained temporarily because ownership and retention requirements are unconfirmed; no reconciliation migration was applied and generated types remain deferred.
- Sales KPI tables, Monday snapshot/profit-source fields, and admin-gated RLS policies were confirmed remotely.
- Vercel production verification on 2026-07-28 found the intended project linked and a current active deployment Ready. All required Production variable names were present, including Gmail OAuth, report-address, service-role, Monday, public Supabase, and cron-secret variables. This evidence predates the 2026-07-31 member-KPI migrations and must not be treated as confirmation that the latest revision is deployed.
- Release verification on 2026-08-03 confirmed remote migration history includes `20260731100000` and `20260731110000`. The latest Ready production deployment was created 2026-07-31 at 15:28 SAST, immediately after commit `709afa1`, and its inspected build contains both cron routes with the repository's `08:05 UTC` EPCC and `08:15 UTC` Monday schedules. Vercel inspection did not expose a Git SHA, so the exact deployed revision is not cryptographically confirmed.

## Production Integration Verification

Verified 2026-07-28 using read-only/dry-run checks only; no live writes were performed.

- Monday: required local server-side configuration is present. The API is reachable and the July 2026 dry-run resolved an accessible monthly board, its expected columns and weekly groups, and a safe planned snapshot with no writes. The manual Monday sync command is dry-run by default; historical writes require explicit bounded review/apply flags. The scheduled cron writes only the UTC current month under its database lock.
- EPCC/NetSuite Gmail: Gmail OAuth and parsing succeeded for the bounded July 2026 report. The existing conflicting KPI value had no tracked ingestion record; after metadata-only audit verification, one approved report was applied and a duplicate rerun was a no-op. July profit is EPCC-sourced, while Monday quote/order fields were preserved. The audit reader is service-role-only and returns no message, sender, subject, or source-hash values.
- Cron and service role: the 2026-07-28 deployment check confirmed the EPCC route and unauthenticated `401` behaviour. The 2026-08-03 authorised route validation is recorded below.
- Remaining action: monitor the first normally scheduled cron result and its EPCC ingestion audit outcome; no further manual trigger is needed solely for verification.
- Authorised live validation on 2026-08-03 invoked EPCC first and Monday second. EPCC returned `duplicate_member_backfill_not_needed` for August; Monday returned `updated` with `quotesDone=4` and `ordersProcessed=1`. The resulting August company row retained EPCC-owned `monthly_profit=358.80` and `monthly_profit_source=epcc_email`, while Monday wrote its own snapshot metadata and quote/order fields. A bounded July EPCC rerun was also `duplicate_member_backfill_not_needed`, with zero reconciliation differences and no change to July's Monday-owned fields.

## Current Routes

| Route | Status |
| --- | --- |
| `/` | Implemented branded landing page; shows sign-in options when signed out and an `Open Pins Hub` action when authenticated |
| `/login` | Implemented |
| `/auth/forgot-password` | Implemented |
| `/auth/confirm` | Implemented route handler |
| `/auth/update-password` | Implemented |
| `/auth/error` | Implemented |
| `/auth/invite` | Implemented invite acceptance flow |
| `/hub` | Protected dashboard shell |
| `/hub/sales-dashboard` | Protected Supabase-first sales dashboard with historical fixture fallback |
| `/hub/calculators` | Protected calculator region menu |
| `/hub/calculators/eu` | Protected EU calculator menu |
| `/hub/calculators/eu/standard` | Protected EU Standard calculator |
| `/hub/calculators/eu/us-clients` | Protected EU US Clients calculator |
| `/hub/calculators/uk/trade` | Protected UK Trade calculator |
| `/hub/commercial-invoices` | Protected Commercial Invoice Generator |
| `/hub/data` | Protected Data Management summary |
| `/hub/data/garments` | Protected Garment Directory; admin data management |
| `/hub/data/product-types` | Protected Product Types manager; admin data management |
| `/hub/team` | Admin-only team invitation/member management |
| `/hub/pk-tax` | Protected calculation-only PK Tax allocation calculator |

## PK Tax

- Source of truth: `docs/planning/PK TAX NEW STRUCTURE - EXPLANATION 1.pdf` and the approved allocation rules. Inputs are overall total, total Snuggle profit, Johan PK Tax, PK Tax brought in by Hardus/Justin/Bux/Shannon, and company profit, Snuggle profit, and orders handled for Hardus/Justin/Bux.
- Fixed allocations: EPCC 40%, Admin 10%, Marketing 5%, and Ops 5% of overall total; Johan receives 40% of Johan PK Tax.
- Pool: 40% of PK Tax brought in by Hardus, Justin, Bux, and Shannon, plus 7% of total Snuggle profit. Eligible recipients are exactly Hardus, Justin, and Bux; Shannon contributes but receives no pool allocation. Seth is removed completely.
- Weighted scores: company profit 40%, Snuggle profit 25%, PK Tax 20%, orders handled 15%. Zero-total metrics add no points; if every weighted metric total is zero, allocations are withheld with a validation error rather than an equal split. Otherwise scores normalize to 100%.
- Rounding: calculations retain precision internally, display currency rounds to two decimals, and a displayed-cent remainder goes to the highest unrounded allocation; ties resolve Hardus, then Justin, then Bux.
- Calculation-only: no persistence, saved reports, history, API route, localStorage, or sessionStorage.
- Export behavior: clipboard text summary includes fixed allocations, pool composition, weighted scores, and recipient allocations; it does not use a filename.

There is no active `/test` route.

## Current Landing UI

- `src/app/page.tsx` is the public entry screen and performs a server-side Supabase auth check.
- The landing screen uses the reusable `src/components/backgrounds/Galaxy.tsx` background and Pins & Knuckles assets under `public/branding/`.
- Email sign-in links to `/login`; Microsoft and Google buttons are present as disabled placeholders until those providers are configured.
- Authenticated users see a direct link to `/hub`.

## Sales Dashboard Status

- Year to Date uses January through the selected dashboard month. Actual profit is summed only from persisted `sales_kpi_months.monthly_profit` rows, regardless of approved source; missing or null rows are never treated as zero. Monthly targets resolve by effective month where supported, annual target sums all twelve resolved monthly targets, and projection annualises the average of authoritative included months.

### Complete

- The Phase 1 Supabase KPI schema is implemented: `sales_kpi_months`, `sales_kpi_member_months`, and `sales_kpi_targets` with RLS.
- The dashboard repository reads production KPI/target data from Supabase using the SSR client; no Monday API call occurs during page rendering.
- Admin-only manual company/member KPI entry writes to Supabase. Supabase rows take precedence, with the normalized workbook fixture filling only missing periods/members as `historical_fixture`.
- The dashboard UI has company/member views, prior-year comparison, targets, filters, member detail, loading/error fallback, and explicit blank values rather than invented zeroes.
- The committed dashboard UI has one Overview, YTD, and Year Comparison tab row. Overview contains the monthly KPI cards; YTD contains its summary cards and graph; Year Comparison excludes Leads from its selector and falls back to Monthly Profit for invalid legacy selections.
- Admins can manage independent final values for Profit, PK Tax, Quotes Done, and Orders Processed from the top action area. Monetary input accepts grouped/currency-prefixed values; final values remain separate from calculated fields.
- Per-person KPI reporting is implemented with source-isolated Monday quote/order fields and EPCC profit/PK Tax fields, member classifications, protected source metadata, and company/member views.
- Targets are admin-editable and metric exports include seven dashboard KPIs, including PK Tax.
- Monday audit tooling exists in `scripts/audit-monday-sales-history.ts` and `scripts/lib/monday/`. It is server-only, read-only, paginated, rejects GraphQL mutations, and writes local audit artifacts under `docs/imports/monday-sales-history/`.
- The historical workbook importer is local-only. It validates input and generates conflict-safe SQL; its default policy is `skip-existing`, so historical imports do not overwrite existing data accidentally.

### Partially Complete

- The dashboard is Supabase-first but still uses `workbookFixture.ts` as a fallback rather than a fully imported historical Supabase dataset.
- Monday monthly-board discovery, validation, per-month summaries, annual aggregation, and a server-only one-month apply / year-preview sync command are implemented. The sync writes Scope A directly to Quotes Done and Orders Processed, retains Scope B in the Sales Inbox fields, and records source details in Monday metadata.
- The dashboard displays Quotes Done, Orders Processed, and their derived Conversion Rate alongside Scope B Sales Inbox Enquiries and Sales Inbox Conversion Rate. A current Monday period is marked non-final.

### Scheduled Operations / Deliberately Deferred

- Current repository `vercel.json` schedules EPCC/Gmail at `08:05 UTC` daily through `/api/cron/epcc-profit`, then Monday at `08:15 UTC` through `/api/cron/monday-sales-sync`. Both routes require constant-time Bearer `CRON_SECRET` authentication and fail independently. Confirm this schedule is deployed; earlier context recorded a different production schedule.
- The Monday cron is restricted to the UTC current month and the Pins & Knuckles organisation. It uses a database-backed per-organisation/month lock, validates the selected board, writes source-isolated member quote/order patches, and cannot accept query-string period overrides. Its temporary daily cadence remains in place only until the Vercel plan supports a more frequent approved schedule.
- Monday owns `quotes_done` and `orders_processed`; it owns profit only through June 2026. From July 2026 onward the Monday payload omits both profit fields, leaving EPCC/NetSuite as the sole profit source.
- The manual Monday CLI remains dry-run by default. A 2025 apply requires one month and `--force`; a 2026 apply additionally requires the explicit matching reviewed scope (`--reviewed-year` and `--reviewed-month`). This is bounded one-month-only support, not a historical/range sync path.
- EPCC/Gmail ingestion CLI remains dry-run by default while its authenticated cron applies valid reports through a service-role-only transactional RPC. Person subtotal profit and PK Tax rows are written only when they reconcile to the report grand totals within £0.01.
- Quotes Done means every included top-level WEEK 1–WEEK 5 Monday item; Orders Processed means `Converted = Yes` under the approved monthly-board rules.

### Member KPI Ownership and Visibility

- Monday exclusively owns member `quotes_done`, `orders_processed`, and `monday_source_metadata`. EPCC exclusively owns member `profit`, `pk_tax`, and `epcc_source_metadata`. Source writes are partial and must never overwrite fields owned by the other source.
- `snuggle_profit` is reserved as nullable storage only. No source currently establishes a reliable Snuggle-profit value, so ingestion leaves it unchanged.
- Stable member identities are `hardus`, `justin`, `bux`, `shannon`, `johan`, and `other_non_dashboard`. Monday uses known person IDs before normalized-name fallback; EPCC uses normalized salesperson names.
- Normal account-manager members are Hardus, Justin, and Bux. Shannon and Johan are stored as `admin_hidden`. The `other_non_dashboard` reconciliation identity is administrator/internal-only.
- Seth maps only to `other_non_dashboard`. His source name may appear in protected source metadata for reconciliation, but he is never a canonical member identity or PK Tax recipient.
- EPCC member ingestion is gated on the sum of all salesperson subtotals matching both report profit and PK Tax grand totals. Customer and order details are never stored in member source metadata.

### Month-End Final Values

- Company KPI final values are optional, independent rows keyed by organisation, year, month, and KPI code. A final value is effective for dashboard metrics, comparisons, progress, and YTD only while present; clearing it immediately restores the calculated source value.
- Calculated Profit and PK Tax remain EPCC-owned; calculated Quotes Done and Orders Processed remain Monday-owned. Their ingestion payloads do not reference the final-value table and cannot overwrite final values.
- Only Pins Hub administrators can set, edit, or clear a final value. The row records `updated_by` and `updated_at`; zero is valid, while Quotes Done and Orders Processed must be whole numbers.
- Confirmed final Profit values: July 2026 `£165,942.07`; December 2025 `£153,931.76`. These do not replace or alter the calculated Profit values.

### Confirmed Monday Reporting Rules

- Board membership is the reporting basis. `Date In Touch` is the authoritative reporting date when valid; when it is blank, the Monday item `created_at` timestamp is the only approved fallback. Other date fields are never used. Malformed dates, missing/invalid creation timestamps, and cross-month assignments remain review/safety conditions.
- Scope A is all weekly-board leads/conversions, with member and channel breakdowns. Scope B is Sales Inbox-only leads/conversions.
- Multi-manager rows count in Scope A company/channel totals but are excluded from member totals; blank-manager rows remain in company/channel totals and are flagged.
- Rows in Profit Tracking and non-weekly groups are excluded. Profit is out of scope for Monday.
- Date mismatches remain in board totals, are excluded from valid-date comparison totals, and are emitted for review in Monday rather than moved between months.
- Current active months are not final historical data. Historical months must be protected from accidental overwrite; the workbook importer already defaults to `skip-existing`.

### Audited 2026 Snapshot

The committed read-only audit was generated 2026-07-21 and covers January–July 2026:

- Scope A: 1,833 leads, 1,190 converted, 64.9% conversion.
- Scope B (Sales Inbox): 432 leads, 167 converted, 38.7% conversion.
- Validation: 2 Date In Touch mismatches, 3 multi-manager items (2 converted), and 0 missing dates. The mismatches are retained in board totals and flagged in the audit artifacts.

### 2026 Monday Persistence Boundary

- Monday is authoritative for `quotes_done` and `orders_processed`. It is authoritative for `monthly_profit` only through June 2026; from July 2026 onward, profit is sourced exclusively from EPCC/NetSuite email.
- From July 2026 onward, Monday's database payload contains only the row identity, `quotes_done`, `orders_processed`, and `monday_sync_metadata`. It omits `monthly_profit`, `monthly_profit_source`, Scope B metric fields, and `data_source`, so EPCC profit provenance is preserved on updates.
- Reporting-date audit metadata records `dateSourceCounts` for `date_in_touch` and `created_at_fallback` so fallback use is visible on each Monday snapshot.
- Week 3 Batch 4 dry-run and bounded apply (2026-07-28): the canonical July board was `18420001220`; the organisation-owned July KPI row was selected and updated with `quotes_done=249` and `orders_processed=141`. The reviewed run had no missing, malformed, or cross-month reporting dates; its current source count was `249` Date In Touch and `0` creation fallbacks. Its existing profit remained `116494.08` with source `epcc_email`, outside the Monday payload.
- The exact bounded July apply was rerun once. Quotes/orders and EPCC profit fields remained stable; only intended Monday snapshot metadata was refreshed. This predated the 2026-07-31 member-KPI change; the 2026-08-03 August validation confirmed the current Monday cron writes source-isolated member quote/order patches.
- The temporary daily cadence is active on the latest inspected deployment; historical reconciliation, board rollover handling, failure alerts, retained audits, and a future approved higher-frequency cadence remain outstanding.

### Week Ending 2026-08-02 Audit

- Committed work on 2026-07-30 and 2026-07-31 completed the weighted PK Tax allocation/export rules, source-isolated member KPI ingestion, source-safe duplicate EPCC backfill, Monday member sync permissions, YTD dashboard reporting, responsive navigation, and shared toast feedback.
- The calculator, delivery-helper, UK Trade, invoice, garment, and Product Type changes in this period were UI/action-feedback standardisation only; calculator pricing formulas were not changed.
- The working tree was clean at audit time. Local verification passed: `npm run lint`, `npx tsc --noEmit`, `npm run build`, and 28 targeted Node tests.
- The 2026-07-31 migrations and current cron routes were not yet confirmed in production at the time of this audit; the 2026-08-03 release validation below supersedes that status.
- The 2026-08-03 authorised release validation confirmed the migrations, configured schedules, required encrypted Production variable names, and both cron routes. The exact Vercel Git SHA remains unavailable from deployment inspection.
- A bounded July 2026 Monday dry-run proposes `quotes_done=302` and `orders_processed=181`, versus persisted `301` and `178`. This deferred source delta must be reviewed before any apply; it is not an idempotent rerun.

### Next Recommended Step

Review the changed July Monday source data before any bounded July apply: the latest dry-run proposes 302 quotes and 181 orders, not the persisted 301 and 178. Continue monitoring the first normally scheduled EPCC/Monday cycle and add failure-alert/retained-audit operations.

## Calculator Status

Implemented:

- Supabase schema and seed migrations for calculator reference data.
- Generated Supabase database types.
- EU Standard and EU US Clients share global Supabase reference-data loading, typed domain engines, validation, price lookup, mappers, client-local state, and presentation components. EU US Clients uses its seeded profile (T-shirt €2, long-sleeve €3, hoodie €4 garment markups); its formatter retains legacy lowercase decoration wording and `+ base` copy.
- EU desktop calculator layout is a responsive two-column surface that uses the available AppShell width: the wider left column contains item inputs and any enabled per-item Delivery Helper; the right column contains Production Costs, Pins Price, and the detailed breakdown. The compact page gutter is retained. At narrow widths the calculator stacks.
- UK Trade route, Supabase reference-data loading, pure tier engine, copy formatter, and detailed cost breakdown are implemented. Print uses floor tiers through 10,000; standard prints use colours plus an underbase screen, neck-standard uses two setup screens, and neck-transfer uses no screens. Screen setup is £20 per screen. Embroidery uses 7,000–15,000 stitch tiers, additional 1,000-stitch blocks above 15,000, £30 setup per applicable position, and the 2,500 tier for quantities above 2,500.
- EU Delivery Helper is per-item and opt-in. Its checkbox is directly beneath PK Markup; when enabled, the expanded helper appears directly beneath that item with no second expand action. It is separate from production, Pins totals, VAT, profit, and quote-copy totals. Its responsive fields do not overlap, its monetary values do not wrap, and copied output uses `Total Delivery Cost Excl. VAT` and `Total Delivery Cost Incl. VAT`.
- EU results provide an open detailed aligned Production/Pins breakdown; UK Trade provides an open detailed cost breakdown. These surfaces read existing result data only; no pricing rules changed.
- Reference assets: `public/reference-assets/eu-delivery-helper-reference.png`, `public/reference-assets/eu-detailed-breakdown-reference.png`, and `public/reference-assets/uk-trade-breakdown-reference.png`.
- Calculator state is client-local only; no browser persistence is used and revisiting a route starts fresh.

Not implemented yet:

- Admin tooling for editing calculator reference data.

Deferred:

- EU Trade. It remains deferred/inactive; no active profile should be added until rules are explicitly confirmed.

## Commercial Invoice Generator

- Route: `/hub/commercial-invoices`.
- Legacy source of truth: `pins-hub-app/src/app/hub/commercial-invoices` in the legacy Pins Hub repository.
- Fields: invoice reference, invoice date, ship date, tracking, box count, weight, GBP/EUR currency, print location, duties payer, sender and receiver contact/address/tax identifiers, and product line details.
- Totals: line cost multiplied by whole-number quantity, total quantity, subtotal, and final invoice total. The legacy tool has no freight, tax, other-charge, or line-weight calculation.
- Export: editable XLSX and landscape A4 PDF using `commercial-invoice-<reference-or-date>` filenames.
- No save, load, history, browser storage, API, or database persistence.
- Reset restores a new dated invoice; leaving and returning to the route also creates a fresh invoice.

## EU Calculator Structure

- Routes:
  - `src/app/(hub)/hub/calculators/page.tsx`
  - `src/app/(hub)/hub/calculators/eu/page.tsx`
  - `src/app/(hub)/hub/calculators/eu/standard/page.tsx`
  - `src/app/(hub)/hub/calculators/eu/us-clients/page.tsx`
- Data:
  - `src/features/calculators/data/calculatorRepository.ts`
  - `src/features/calculators/data/mappers.ts`
- Domain:
  - `src/features/calculators/domain/euPricingEngine.ts`
  - `src/features/calculators/domain/priceLookup.ts`
  - `src/features/calculators/domain/profiles.ts`
  - `src/features/calculators/domain/types.ts`
  - `src/features/calculators/domain/validation.ts`
- UI:
  - `src/features/calculators/components/CalculatorShell.tsx`
  - `src/features/calculators/components/EuCalculator.tsx`
  - `src/features/calculators/components/EuItemCard.tsx`
  - `src/features/calculators/components/EuDeliveryHelper.tsx`
  - `src/features/calculators/components/EuCalculatorResults.tsx`
  - `src/features/calculators/lib/euBreakdownRows.ts`
- Tests:
  - `src/features/calculators/tests/calculatorRepository.test.ts`
  - `src/features/calculators/tests/euCalculatorInteractions.test.ts`
  - `src/features/calculators/tests/euDeliveryHelper.test.ts`
  - `src/features/calculators/tests/euDeliveryVisibility.test.ts`
  - `src/features/calculators/tests/euBreakdownRows.test.ts`
  - `src/features/calculators/tests/euCalculatorResults.test.ts`
  - `src/features/calculators/tests/euPricingEngine.test.ts`
  - `src/features/calculators/tests/euQuoteFormatter.test.ts`
  - `src/features/calculators/tests/ukTradePricingEngine.test.ts`

### EU Standard and EU US Clients UI

- Desktop uses a responsive two-column calculator layout. The left column contains garment/quantity inputs, compact print controls, compact embroidery controls, PK Markup, Include delivery costs, and an enabled Delivery Helper immediately beneath its related item. The right column contains Production Costs and Pins Price cards side by side where space permits, then the detailed breakdown.
- On narrow screens the surfaces stack. The working tree keeps an enabled Delivery Helper directly below its related item; it does not currently move below the right-column results on mobile.
- Print positions are compact multi-select buttons: Front, Back, Left Sleeve, Right Sleeve, and Neck. Only selected positions render their configuration controls. Embroidery 1, Embroidery 2, and Embroidery 3 are compact selectable buttons; only selected embroidery controls render. EU Standard and EU US Clients pricing behaviour is unchanged.
- Every EU print-position colour input has a maximum of 9. Entering 10 or more normalises the displayed value to 9; values 1–9 remain unchanged; a field can be temporarily empty while editing; blur retains the existing minimum-value normalisation.
- Missing-garment validation is action-gated: it is absent on initial load and after focus/blur of an empty garment field. It appears only after attempting to add another item with no garment, or selecting/adding a print position with no garment. Selecting a garment clears it immediately. Embroidery retains its existing independent behaviour unless it reaches the same shared path.
- Pins Price is an explicit accessible copy action. Clicking the card or its copy control copies the existing customer-facing quote, keyboard activation is supported, and shared toast feedback and quote content are unchanged. The semantic button implementation uses one activation path so nested interaction cannot duplicate clipboard calls or toasts.

### EU Delivery Helper

- Include delivery costs appears directly beneath PK Markup. The helper is expanded when enabled and requires no second expand action.
- Number of boxes and Cost per box use responsive minimum-safe grid cells and do not overlap. Cost per box, delivery subtotal excl. VAT, VAT, total delivery cost incl. VAT, and delivery-summary values are non-wrapping.
- Delivery remains separate from Production Costs, Pins Price, VAT, profit, and quote totals. Delivery rates, calculations, delivery markup, and delivery VAT are unchanged.
- The separate delivery copy uses `Total Delivery Cost Excl. VAT` and `Total Delivery Cost Incl. VAT`; it no longer labels the total ex-VAT value as `Cost Per Box`.

### EU Breakdown

- Breakdown remains directly beneath the result cards. Each quote item is one combined outer card with its item heading/quantity, Production Cost section, and Pins Price section.
- Desktop/tablet renders Production Cost and Pins Price side by side. Mobile stacks Production Cost above Pins Price inside the same card.
- `src/features/calculators/lib/euBreakdownRows.ts` creates the presentation-only shared semantic row order: garment base price per unit; garment markup per unit; PK markup per unit; selected print-position rows; selected embroidery rows; digitising where applicable; unit cost; item subtotal.
- Both columns consume the same row slots. Pins-only garment/PK markup keeps an empty aligned Production cell: no dash, zero, placeholder, duplicate label, or upward shift of later Production values. On mobile, empty slots are not rendered as visual spacers.
- Decoration rows use semantic keys, not array position: Front, Back, Left Sleeve, Right Sleeve, Neck, matching embroidery occurrences, and digitising align with their corresponding Pins values. Currency values remain right-aligned and non-wrapping.

### Pricing and persistence boundary

The EU UI revisions did not change EU Standard or EU US Clients pricing; garment markup matrices; PK markup calculations; print tiers; embroidery prices; digitising fees; VAT; delivery markup/VAT; quote formatting; exports; Supabase repository behaviour; or seeded calculator reference data. Calculator state remains client-local with no persistence.

### Calculator test and verification snapshot

- Interaction and presentation coverage protects initial/action-gated missing-garment validation, clearing after garment selection, 1–9 colour values and the cap at 9, multiple print selection, selected-only print/embroidery controls, delivery calculation/copy wording, breakdown reconciliation and aligned slots, representative EU Standard/EU US Clients totals, and UK Trade pricing-engine behaviour.
- Current recorded calculator validation: production build passed; lint passed; TypeScript passed; calculator tests passed: 57; calculator test failures: 0; `git diff --check` passed. Node `MODULE_TYPELESS_PACKAGE_JSON` notices are non-blocking warnings, not test failures.

## Repository Structure

- `src/app`: App Router routes and route-level composition.
- `src/components/auth`: Auth forms and auth actions.
- `src/components/layout`: Protected shell, sidebar, page header, access denied state.
- `src/components/ui`: Shared UI primitives and state components.
- `src/features/calculators`: Calculator data access, mapping, domain logic, UI, and tests.
- `src/features/data-management`: Garment and Product Type catalog managers.
- `src/features/commercial-invoices`: Commercial invoice form and XLSX/PDF export.
- `src/features/pk-tax`: Calculation-only PK Tax domain and UI.
- `src/features/team`: Admin invite and team-member management.
- `src/features/sales-dashboard`: Supabase-first KPI repository, domain calculations, UI, manual admin writes, fixture fallback, and tests.
- `scripts/lib/monday`, `scripts/audit-monday-sales-history.ts`, and `scripts/sync-monday-sales-dashboard.ts`: server-only Monday audit/aggregation and explicit CLI sync tooling; no browser/API route access to Monday credentials.
- `src/lib/access`: Pins Hub access helpers.
- `src/lib/supabase`: Supabase SSR proxy and server clients.
- `src/types/database.types.ts`: Generated Supabase database types.
- `supabase/migrations`: Applied SQL migrations and seed data.
- `docs/planning`: Validated planning and legacy behaviour notes.

## UI Rules

- Keep UI compact, dark, and operational.
- Do not add marketing pages, hero sections, decorative badges, helper paragraphs, or subtitles unless explicitly requested.
- Reuse `src/components/ui`, `src/components/layout`, and feature components before adding new patterns.
- Shared UI primitives are mandatory where they clearly fit; do not duplicate their surface, form-control, state, or clipboard behaviour.
- Optional labels stay empty unless manually supplied, and empty labels never render. Do not add helper text without explicit approval.
- Use Magic Bento only for navigation, actionable, KPI/metric, or interaction-benefiting result cards; never for forms, tables, dialogs, loading/error states, or dense breakdowns. Keep motion and glow restrained and preserve reduced-motion and keyboard support.
- Use `ActionMenu` for grouped related actions. Use whole-card `CopyableCard` interaction only when copying is the primary action.
- Every data surface should handle loading, empty, and error states.
- Use server components for initial data loading where practical; keep forms and rich controls as client components.

## Development Workflow

- Do not install packages unless explicitly requested.
- Do not edit applied migrations for routine changes; add a new migration.
- Do not run `supabase db push` unless explicitly requested.
- Do not commit unless explicitly requested.
- Use generated database types in Supabase repositories.
- Keep calculator formulas out of UI components.

Migration workflow:

```bash
npx supabase migration new <name>
npx supabase db push
```

Type generation:

```bash
npx supabase gen types typescript --project-id <project-id> --schema public > src/types/database.types.ts
```

Verification:

```bash
npm run lint
npx tsc --noEmit
node --test src/features/calculators/tests/*.test.ts
npm run build
```

## Known Issues

- Turbopack HMR caused repeated reload/request loops; local development uses Webpack.
- Sales dashboard is Supabase-first with historical fixture fallback when persistent data is unavailable.
- Monday audit/import/sync tooling exists, but production configuration and deployment verification remain required.
- EPCC Gmail profit ingestion exists, but Gmail OAuth, cron, service-role configuration, and migration deployment require production verification.
- Admin workflows for calculator data are not implemented.
- Product Types and reviewed garment data are imported from the reviewed datasets. A temporary generic `Hoodies` Product Type maps the 16 hoodie records whose material is not reliably known; it uses the existing `HOODIE` pricing category and must later be replaced with `Hoodies - cotton` or `Hoodies - poly / cotton` when material evidence is available. Near-match garment conflicts outside those safely matched hoodie rows remain pending manual review. Garment Product Type assignment remains staged through nullable `product_type_id`.
- Invoice addresses remain deferred.

## Data Management

- Routes: `/hub/data`, `/hub/data/garments`, and `/hub/data/product-types`.
- Pins Hub read access can view Product Types and garments; write access can add, edit, and deactivate them; admin access can permanently delete garments and unreferenced Product Types.
- Garments require an active Product Type and at least one EUR or GBP price when active. The selected Product Type controls the synchronized transitional `garment_type` and future calculator pricing category.
- Calculator garment markups are profile-specific legacy data, not an EU/US offset rule: EU Standard is TSHIRT €3.00, LONGSLEEVE €3.50, HOODIE €5.00; EU US Clients is TSHIRT €2.00, LONGSLEEVE €3.00, HOODIE €4.00. The generic `Hoodies` fallback and both material-specific hoodie Product Types resolve through `HOODIE`; UK Trade remains unchanged. Material-specific hoodie mapping and remaining near-match garment records are manual-review items; invoice-address management remains deferred.
- EU Trade remains deferred pending confirmed rules.
- Garment Directory and Quick Reference have no active routes.

## Next Recommended Work

1. Deploy and validate the 2026-07-31 member-KPI migrations and scheduled EPCC/Monday release; confirm source ownership is preserved on persisted rows.
2. Reconcile `vercel.json`, deployed cron schedules, and operational documentation; current repository schedules are `08:05 UTC` EPCC and `08:15 UTC` Monday.
3. Replace or explicitly bound the sales-dashboard fixture fallback as persistent historical KPI coverage is confirmed.
4. Run approved real-world calculator and commercial-invoice export parity cases before changing pricing/reference data.
5. Design admin-only calculator reference-data editing after read-only calculator flows are stable.
# Feedback standardisation

Operational mutations, exports, and clipboard actions use shared Sonner feedback; field, calculator, invoice, access, and route-level validation remains inline.
