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

## Current Tech Stack

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
- Vercel production verification on 2026-07-28 found the intended project linked and a current active deployment Ready. All required Production variable names are present, including Gmail OAuth, report-address, service-role, Monday, public Supabase, and cron-secret variables. The deployed cron route and `0 10 * * *` schedule are present, and unauthenticated probes return 401 before apply mode. The deployment follows the EPCC hardening/audit-reader revision; no authenticated cron execution was manually triggered.

## Production Integration Verification

Verified 2026-07-28 using read-only/dry-run checks only; no live writes were performed.

- Monday: required local server-side configuration is present. The API is reachable and the July 2026 dry-run resolved an accessible monthly board, its expected columns and weekly groups, and a safe planned snapshot with no writes. Monday's sync command is dry-run by default; writes require explicit `--apply`, a single month, `--year 2025`, and `--force`, so it cannot currently write 2026 snapshots.
- EPCC Gmail: Gmail OAuth and parsing succeeded for the bounded July 2026 report. The existing conflicting KPI value had no tracked ingestion record; after metadata-only audit verification, one approved report was applied and a duplicate rerun was a no-op. July profit is now EPCC-sourced, while Monday quote/order fields were preserved. The audit reader is service-role-only and returns no message, sender, subject, or source-hash values.
- Cron and service role: `vercel.json` schedules `GET /api/cron/epcc-profit` daily at `0 10 * * *`; the current production deployment includes the route and schedule, has all required Production variable names, and unauthenticated probes return 401. The authenticated route has not been manually invoked.
- Remaining action: monitor the first scheduled cron result and its EPCC ingestion audit outcome; do not manually trigger it solely for verification.

## Current Routes

| Route | Status |
| --- | --- |
| `/` | Implemented branded landing page; shows sign-in options when signed out and an `Open Pins Hub` action when authenticated |
| `/login` | Implemented |
| `/auth/forgot-password` | Implemented |
| `/auth/confirm` | Implemented route handler |
| `/auth/update-password` | Implemented |
| `/auth/error` | Implemented |
| `/hub` | Protected dashboard shell |
| `/hub/sales-dashboard` | Protected Supabase-first sales dashboard with historical fixture fallback |
| `/hub/calculators` | Protected calculator region menu |
| `/hub/calculators/eu` | Protected EU calculator menu |
| `/hub/calculators/eu/standard` | Protected initial EU Standard calculator |
| `/hub/calculators/eu/us-clients` | Protected EU US Clients calculator |
| `/hub/calculators/uk/trade` | Protected UK Trade calculator |
| `/hub/garments` | No active route |
| `/hub/quick-reference` | No active route |
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

### Complete

- The Phase 1 Supabase KPI schema is implemented: `sales_kpi_months`, `sales_kpi_member_months`, and `sales_kpi_targets` with RLS.
- The dashboard repository reads production KPI/target data from Supabase using the SSR client; no Monday API call occurs during page rendering.
- Admin-only manual company/member KPI entry writes to Supabase. Supabase rows take precedence, with the normalized workbook fixture filling only missing periods/members as `historical_fixture`.
- The dashboard UI has company/member views, prior-year comparison, targets, filters, member detail, loading/error fallback, and explicit blank values rather than invented zeroes.
- Monday audit tooling exists in `scripts/audit-monday-sales-history.ts` and `scripts/lib/monday/`. It is server-only, read-only, paginated, rejects GraphQL mutations, and writes local audit artifacts under `docs/imports/monday-sales-history/`.
- The historical workbook importer is local-only. It validates input and generates conflict-safe SQL; its default policy is `skip-existing`, so historical imports do not overwrite existing data accidentally.

### Partially Complete

- The dashboard is Supabase-first but still uses `workbookFixture.ts` as a fallback rather than a fully imported historical Supabase dataset.
- Monday monthly-board discovery, validation, per-month summaries, annual aggregation, and a server-only one-month apply / year-preview sync command are implemented. The sync writes Scope A directly to Quotes Done and Orders Processed, retains Scope B in the Sales Inbox fields, and records source details in Monday metadata.
- The dashboard displays Quotes Done, Orders Processed, and their derived Conversion Rate alongside Scope B Sales Inbox Enquiries and Sales Inbox Conversion Rate. A current Monday period is marked non-final.

### Scheduled Operations / Deliberately Deferred

- The repository Vercel configuration schedules EPCC/Gmail independently at `10:00` daily through `/api/cron/epcc-profit`, then Monday 15 minutes later at `10:15` through `/api/cron/monday-sales-sync`. Both routes require constant-time Bearer `CRON_SECRET` authentication and fail independently.
- The Monday cron is restricted to the UTC current month and the Pins & Knuckles organisation. It uses a database-backed per-organisation/month lock, validates the selected board, writes no member KPI rows, and cannot accept query-string period overrides. Its temporary daily cadence remains in place only until the Vercel plan supports a more frequent approved schedule.
- Monday owns `quotes_done` and `orders_processed`; it owns profit only through June 2026. From July 2026 onward the Monday payload omits both profit fields, leaving EPCC/NetSuite as the sole profit source.
- The manual Monday CLI remains dry-run by default. A 2025 apply requires one month and `--force`; a 2026 apply additionally requires the explicit matching reviewed scope (`--reviewed-year` and `--reviewed-month`). This is bounded one-month-only support, not a historical/range sync path.
- EPCC/Gmail ingestion CLI remains dry-run by default while its authenticated cron applies valid reports through the service-role-only RPC. July 2026 ingestion and duplicate handling were verified after resolving an untracked historical KPI value.
- Quotes Done and Orders Processed remain separate metrics. Their actual source and attribution/completion semantics are not confirmed, so they must not be inferred from Monday lead/conversion data.

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
- The exact bounded July apply was rerun once. Quotes/orders and EPCC profit fields remained stable; only intended Monday snapshot metadata was refreshed. The sync does not write member KPI rows or other company months.
- The temporary daily cadence is configured pending deployment; historical reconciliation, board rollover handling, failure alerts, retained audits, and a future approved higher-frequency cadence remain outstanding.

### Next Recommended Step

Verify production deployment/configuration for the Monday sync and EPCC Gmail ingestion, then validate the persisted KPI output before operational use.

## Calculator Status

Implemented:

- Supabase schema and seed migrations for calculator reference data.
- Generated Supabase database types.
- EU Standard route and initial UI.
- EU calculator repository loading global reference data.
- EU domain engine, validation, price lookup, profile constants, mappers, and tests.
- EU US Clients route using the shared EU foundation and its seeded profile: garment markups are T-shirt €2, long-sleeve €3, and hoodie €4. Its pure formatter preserves legacy lowercase decoration wording and `+ base` copy.
- UK Trade route, Supabase reference-data loading, pure tier engine, copy formatter, and tests. Print uses floor tiers through 10,000 with £20 screen setup; embroidery uses 7,000–15,000 stitch tiers, additional 1,000-stitch blocks, £30 setup per position, and the 2,500 tier above 2,500 units.
- EU Standard and EU US Clients include a collapsed-by-default delivery sales helper backed by Supabase delivery rates. Delivery remains separate from production, Pins totals, VAT, profit, and quote-copy totals; its separate copy output preserves the legacy structure.
- EU results provide an open detailed Production/Pins breakdown, and UK Trade provides an open detailed cost breakdown. These surfaces read existing result data only; no pricing rules changed.
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
  - Supporting controls and summary components in the same folder.
- Tests:
  - `src/features/calculators/tests/calculatorRepository.test.ts`
  - `src/features/calculators/tests/euPricingEngine.test.ts`

## Repository Structure

- `src/app`: App Router routes and route-level composition.
- `src/components/auth`: Auth forms and auth actions.
- `src/components/layout`: Protected shell, sidebar, page header, access denied state.
- `src/components/ui`: Shared UI primitives and state components.
- `src/features/calculators`: Calculator data access, mapping, domain logic, UI, and tests.
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

1. Verify the Monday sync and EPCC Gmail ingestion in production configuration before operational use.
2. Replace or explicitly bound the sales-dashboard fixture fallback as persistent historical KPI coverage is confirmed.
3. Design admin-only calculator reference-data editing after read-only calculator flows are stable.
