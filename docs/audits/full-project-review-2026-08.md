# Full Project Review

Audit date: 2026-08-05

Scope: current tracked Pins Hub application, configuration, migrations, scripts, tests, documentation, and public assets. The Next.js App Router and Supabase implementation are treated as authoritative. Legacy Prisma/Neon material was reviewed only as reference documentation and is not proposed for restoration.

Method: route conventions, static imports/exports, dynamic imports, App Router entry points, package/configuration references, test references, script entry points, migrations, generated types, and documentation were cross-checked. This was a read-only review; the only repository output is this report. No applied migration is proposed for deletion or editing.

## Executive Summary

The repository is structurally healthy: routes are mostly thin, calculator formulas live in pure domain modules, Supabase browser/SSR/service-role clients are separated, and Monday/EPCC ingestion preserves its documented source ownership. No evidence supports reintroducing Prisma, Neon, or legacy architecture.

There are 10 confirmed safe removals: seven unreachable production modules and three unused direct Radix dependencies. The largest operational risk is verification coverage: `package.json` has no unified test script, while the documented command runs only calculator tests and leaves the 49-test suite's dashboard, source-isolation, cron, PK Tax, invoice, and access-adjacent checks out of normal handoff verification.

The highest-value next work is a small safe cleanup batch, followed by test-command and documentation alignment. Do not remove historical migrations, workbook fallback data, ingestion/audit tooling, deferred EU Trade references, transitional `garment_type`, generated types, reconciliation identities, or reference assets.

## Repository and Feature Inventory

| Area | Evidence | Status |
| --- | --- | --- |
| App Router | 30 route/layout/loading/error/handler files under `src/app`; conventional routes include auth, hub, calculators, commercial invoices, data, PK Tax, sales dashboard, team, and two cron handlers. | No unused route found. Convention-based files are retained. |
| Features | 275 source files total; primary feature counts: sales dashboard 106, calculators 43, commercial invoices 16, data management 16, team 9, PK Tax 5, auth 2. | Active feature boundaries are generally appropriate. |
| Tests | 49 `.test.ts` files and 323 test cases across source and scripts. | Substantial business-logic coverage, but execution is incomplete by default. |
| Scripts | 22 files for EPCC ingestion, Monday audit/sync, historical KPI import, cleanup, and audit tasks. | Retain; these are operational/manual tooling, not dead code. |
| Database | 25 forward-only migrations from foundation access through invoice-product type changes. | Retain all applied-history migrations. |
| Documentation | 199 files, including generated reconciliation outputs and legacy/planning records. | Several operational and planning documents are stale or duplicated. |
| Assets | 12 public assets: brand assets, current calculator reference images, and archived screenshots. | Retain; see intentionally retained section. |

## Confirmed Safe Removals

All items below were checked for imports, App Router convention use, dynamic lookup, tests, package/configuration references, and operational-documentation references. Risk is low because no runtime or test dependency was found.

| Path | What it does | Evidence it is unused | Risk | Recommended action |
| --- | --- | --- | --- | --- |
| `src/features/calculators/components/CalculatorTotals.tsx` | Older EU totals presentation component. | No import outside its own declaration; the active calculator renders totals through `EuCalculatorResults.tsx`; no route, test, dynamic import, or docs operational dependency. | Low | Remove after one final `rg` check in the cleanup branch. |
| `src/features/calculators/components/GarmentSelector.tsx` | Older garment selection UI. | No application import; active EU/UK selection uses `GarmentCombobox.tsx`; only legacy/planning prose names the old component. | Low | Remove. Update planning prose only if it is intended to describe the current code. |
| `src/features/sales-dashboard/components/DateRangeFilter.tsx` | Planned date-range selector. | No application/test import or route use; current dashboard derives year/month from search parameters and renders its active controls in `SalesDashboard.tsx`; sole non-source reference is the stale dashboard plan. | Low | Remove. |
| `src/features/sales-dashboard/components/LeadSourceTable.tsx` | Earlier lead-source table. | No imports, route reference, dynamic import, test dependency, or configuration reference. Current dashboard uses active KPI views instead. | Low | Remove. |
| `src/features/sales-dashboard/components/SalesInboxTable.tsx` | Earlier sales-inbox table. | No imports, route reference, dynamic import, test dependency, or configuration reference. | Low | Remove. |
| `src/features/sales-dashboard/components/SalespersonTable.tsx` | Earlier salesperson table. | No imports, route reference, dynamic import, test dependency, or configuration reference. | Low | Remove. |
| `src/features/sales-dashboard/lib/exportEpccProfitPdf.ts` | Standalone jsPDF EPCC export helper. | `exportEpccProfitPdf` has no imports or calls. The live PDF path is `ExportMetricsButton.tsx`, which dynamically imports `html2canvas` and `jspdf`; commercial-invoice PDF export is separate. | Low | Remove. Keep live dashboard and invoice export paths unchanged. |
| `package.json`: `@radix-ui/react-checkbox` | Direct Radix checkbox package declaration. | No source/script import, dynamic import, test reference, or configuration reference. Native checkbox controls are used. | Low | Remove the direct declaration and refresh lockfile in the approved cleanup change. |
| `package.json`: `@radix-ui/react-label` | Direct Radix label package declaration. | No source/script import, dynamic import, test reference, or configuration reference. | Low | Remove the direct declaration and refresh lockfile in the approved cleanup change. |
| `package.json`: `@radix-ui/react-slot` | Direct Radix Slot package declaration. | No source/script import, dynamic import, test reference, or configuration reference. It may remain transitively installed through other packages, but does not need to be a direct dependency. | Low | Remove the direct declaration and refresh lockfile in the approved cleanup change. |

## Refactor Recommendations

| Path or area | Current issue | Why it matters | Recommended approach | Behaviour that must remain unchanged |
| --- | --- | --- | --- | --- |
| `src/features/sales-dashboard/lib/metricsExport.ts` | `DashboardExportFilters` is passed to `buildMetricExportRows` but never read; `npx tsc --noEmit --noUnusedLocals --noUnusedParameters` reports it. | It misstates the export contract and hides unused API surface. | Remove the unused parameter/type or use it only if export semantics genuinely need it. Add/adjust direct behavioural tests. | CSV metric values, period, source, and final/non-final status. |
| Dashboard and calculator routes | Several pages load Supabase data before `AppShell` resolves Pins Hub access. RLS prevents data exposure, but unauthorised visitors can still trigger avoidable queries and error paths. | Reduces unnecessary requests and makes access enforcement more explicit. | Resolve access before feature data in a shared server helper or route-level guard, then pass it to `AppShell` and repository loaders. | Existing access levels, RLS, access-denied UI, and no access bypass. |
| Cron routes | EPCC route contains auth/try/catch directly while Monday uses `createMondaySalesSyncCronHandler`. | Duplicate operational envelope increases drift risk. | Extract a small shared cron wrapper only if it can retain distinct handler dependencies and response bodies. | Separate schedules, constant-time `CRON_SECRET` check, independent failures, Monday lock, and source isolation. |
| `src/features/sales-dashboard/server/mondaySalesCron.ts`, `scripts/sync-monday-sales-dashboard.ts` | Multiple `as never` casts suppress Supabase write/RPC typing. | Schema changes can silently break source-safe writes. | Define typed write payloads that match the now-regenerated `Database` insert/update/RPC contracts. | Monday writes only quote/order fields after July 2026 and never overwrites EPCC-owned fields. |
| `src/features/team/data/teamMembers.ts`, `src/features/team/actions/inviteMember.ts` | `unknown` casts bridge nested Supabase relation data and provisioning-client types; `getTeamMembers` performs one admin `getUserById` call per membership. | Type safety and performance degrade as the team grows. | Use a narrow typed relation mapper; investigate whether invitation state can be obtained in a bounded bulk/admin query. | Admin-only provisioning, membership/app-access ownership, invitation status semantics, and no service-role client in browser code. |
| Sales dashboard presentation | The dashboard has both older table components (safe removals) and current MetricUI-based views, with local components/styles spread across KPI variants. | The remaining component vocabulary is harder to navigate than necessary. | After dead-code removal, consolidate only genuinely repeated metric/card wrappers behind the current `MetricKpiCard`/shared UI vocabulary. | Current Overview, YTD, comparison, TV, Snuggle, final-value, export, reduced-motion, and responsive behaviour. |
| Data-management actions | Product-type, garment, and invoice-directory mutations each repeat access resolution and write-result shaping. | Repetition increases the chance of inconsistent write/error behaviour. | Introduce a small server-only mutation guard/result helper after confirming desired role semantics. | Organisation scoping, admin vs write permissions, RLS as final enforcement, validation messages, and revalidation paths. |
| `src/app/(hub)/hub/calculators/*/page.tsx` | EU Standard is readable and multi-line; UK Trade and EU US Clients compress whole routes into one-line component bodies. | This hinders reviews and error-path maintenance, even though current logic is thin. | Reformat these route files only as part of a scoped route-consistency refactor, not the safe cleanup batch. | Profile codes, reference-data loading, loading fallbacks, error states, and calculator formulas. |

## Architecture and Best-Practice Findings

- **No issue found — calculator formulas:** EU and UK calculations, validation, tier lookup, delivery calculation, breakdown construction, and quote formatting live in calculator domain/lib modules. UI components orchestrate state and presentation rather than embedding pricing formulas.
- **No issue found — route thinness overall:** App Router pages mainly compose shells, resolve route parameters, and call feature repositories. The dashboard, calculator, commercial-invoice, data-management, PK Tax, and team routes follow this pattern. The compact calculator route formatting is a readability issue, not an architectural violation.
- **Refactor recommended — pre-data access guard:** `AppShell` centrally prevents rendering when Pins Hub access is absent, which is correct for UI. Moving access resolution ahead of expensive page data queries would make the server boundary stronger and reduce unauthorised work.
- **No issue found — client boundaries:** Client components correspond to forms, chart/export/TV interactions, calculator drafting, clipboard feedback, and interactive controls. Initial data loading remains server-side where practical.
- **No issue found — shared states:** `LoadingState`, `ErrorState`, `EmptyState`, `Surface`, `Select`, feedback helpers, and copy helpers are actively reused. Do not remove them merely because individual route-level loading/error files are sparse; App Router convention files are active by pathname.
- **Refactor recommended — test resilient outcomes, not source text:** 17 tests read source files and assert classes/JSX/route text. Keep a small number of structural regression tests where needed, but migrate visual/layout and route assertions toward rendered or behaviour-level tests to reduce false failures during harmless refactors.

## Supabase, Security, RLS, and Source-Ownership Findings

- **No issue found — client separation:** `src/lib/supabase/client.ts` uses the publishable browser client; `server.ts` uses SSR cookies; `proxy.ts` refreshes auth sessions; and `admin.ts` is protected by `server-only` and reads `SUPABASE_SERVICE_ROLE_KEY` only on the server.
- **No issue found — secrets:** Monday, Gmail OAuth, cron secret, and service-role key references are server-side. No `NEXT_PUBLIC_` Monday token was found. `NEXT_PUBLIC_SUPABASE_URL` and publishable key are appropriate public configuration.
- **No issue found — source ownership:** Monday cron payloads intentionally exclude EPCC-owned profit fields from July 2026 onward. EPCC member writes intentionally exclude Monday-owned quote/order fields. Reconciliation and canonical member mapping are covered by focused tests.
- **Resolved for the current schema — remote type/schema drift:** The obsolete `ingest_epcc_monthly_profit` overload that wrote to `sales_kpi_profit_email_sources` is retired remotely. `src/types/database.types.ts` was regenerated from the current remote public schema and now contains only the two active EPCC RPCs. The legacy table and historical July 2026 row remain intentionally retained; eventual table cleanup is a separate retention decision.
- **Intentionally retained / do not remove — EPCC audit reader and historical restore migrations:** `20260728120000_restore_epcc_profit_ingestion.sql` repeats the earlier EPCC objects as a forward-only recovery from recorded remote drift; `20260728130000_add_epcc_profit_ingestion_audit_reader.sql` exposes only service-role metadata. Their apparent duplication is historical safety, not removable dead code.
- **Needs business confirmation — canonical organisation hard-coding:** EPCC and Monday server paths use the Pins & Knuckles organisation UUID by design. This is safe for the current single-organisation operational scope but must be explicitly redesigned, not generalized casually, before multi-organisation cron support.
- **No issue found — RLS intent in migrations:** Foundation, calculator, KPI, TV settings, and invoice migrations enable RLS and define read/write/admin policies or service-role-only RPC grants. Static review cannot prove the remote database still matches these migrations; verify remote migration history/RLS in a separately authorised operational check.

## Dependency and Configuration Findings

- **Confirmed safe removals:** the three unused direct Radix dependencies listed above.
- **No issue found — active dependencies:** Supabase SSR/client, Radix Select/dropdown, class-variance-authority, clsx, Tailwind merge, ExcelJS, GSAP, OGL, MetricUI, Sonner, Lucide, Next themes, html2canvas, jsPDF, and jspdf-autotable all have source, script, configuration, or dynamic-import usage.
- **Refactor recommended — test script:** `package.json` exposes no `test` script. Add a deterministic, documented Node test command covering `src` and `scripts` test files, then make CI/local verification invoke it. This is not a dependency installation request.
- **Documentation update — verification mismatch:** `docs/planning/WEEK_3_JULY_STATUS.md` claims a unified `npm test` command exists; it does not. README and canonical context currently run only calculator tests.
- **Documentation update — environment coverage:** `.env.example` accurately lists active server-only Monday, Gmail, service-role, and cron variables, but README only documents the two public Supabase variables. Link README to `.env.example` or enumerate all variable names and their server-only rules.
- **Documentation update — cron schedule:** `vercel.json` is authoritative at `5 8 * * *` for EPCC and `15 8 * * *` for Monday (08:05 and 08:15 UTC). The EPCC ingestion guide explicitly labels its older `0 10 * * *` text obsolete, and the July status is a historical SAST record.
- **Needs technical confirmation — Next configuration:** `next.config.ts` intentionally pins `allowedDevOrigins` to `192.168.3.34` and dev uses Webpack due to a recorded Turbopack HMR loop. Confirm the LAN origin is still required before removing or changing it; do not treat it as safe dead configuration.

## Test Coverage Findings

- **Refactor recommended — execute all tests by default:** 49 test files cover domain pricing, KPI calculations, ingestion, cron auth, source isolation, final values, invoice logic, team provisioning, and scripts. Normal verification runs only `src/features/calculators/tests/*.test.ts`, so most of this suite is omitted.
- **Missing test — route/access preflight:** Add tests proving that unauthorised/no-access requests do not start dashboard, calculator, invoice-directory, or data-management loading before the access decision. Preserve RLS as the backstop.
- **Missing test — cron route parity:** Test the actual Monday API route's missing/invalid/valid `CRON_SECRET` responses and the EPCC route's outcome/error contract. Existing auth and server tests are strong but do not replace endpoint-level integration coverage.
- **Missing test — database contract boundary:** Add a typed or integration-level check for the generated Supabase definitions used by Monday locks/member writes, EPCC ingestion RPC, invoice directory, TV settings, and final values. This would catch type/schema drift without relying on `as never`.
- **Missing test — PK Tax UI and copy/export integration:** Pure PK Tax calculations are well tested, but there is no focused rendered/UI test for validation/reset/copy action integration.
- **Missing test — commercial-invoice directory action authorization:** Domain and mapper tests exist; add server-action tests for organisation mismatch, read/write/admin boundaries, and soft lifecycle behaviour.
- **Brittle tests:** Source-string tests in calculator visibility/results, dashboard navigation/TV/export/final-value surfaces, team submission, and script migration tests are useful as temporary guardrails but are coupled to filenames, Tailwind classes, and JSX text. Gradually replace UI source assertions with behaviour tests; retain migration-text tests for immutable historical contracts where runtime integration is not available.
- **Intentionally retained / do not remove:** `workbookFixture.ts`, `fixtures.ts`, Gmail `.eml` fixtures, and generated source reconciliation fixtures are test/runtime evidence. `workbookFixture.ts` is also a live fallback in `salesDashboardRepository.ts`, not test-only data.

## Migration and Schema Findings

- **Intentionally retained / do not remove — all 25 migrations:** They form forward-only applied history. Similar-looking pairs are deliberate: EPCC restoration addresses observed drift; member source-isolation/backfill evolutions add safety; TV schema/RPC and invoice schema/seed/extensions are successive feature migrations.
- **Documentation update — historical migration status:** `docs/sales-dashboard-tv-settings-plan.md` says TV migrations are staged and not applied, while current code, generated types, route, repository, actions, and later migrations all reference the feature. Replace it with an implementation/operations record or mark it historical.
- **Documentation update — foundation migration language:** `docs/database-foundation.md` says to apply the 20260709 foundation migration “when ready.” It is historical guidance; current implementation/type/docs indicate it is part of the active migration chain. Mark it historical or point to the canonical context.
- **Resolved for requested objects — remote schema alignment:** Current remote public-schema types confirm `cron_run_history`, the retained `sales_kpi_profit_email_sources` table, and the two active EPCC RPCs. Full remote RLS/grant parity remains a separate operational concern.
- **Intentionally retained / do not remove — transitional `garment_type`:** Runtime garment/product-type mapping and migration comments identify `garment_type` as the legacy calculator markup key while Product Type categories mature. It remains queried and synchronized; deleting it now risks pricing behaviour.
- **No issue found — final values and source isolation:** The final-values table, member source-isolation fields, EPCC transactional RPC, Monday lock, and related repository calls are present in migrations, generated types, runtime code, and tests.

## Documentation Discrepancies

| Document path | Current documented claim | Actual repository state | Required correction |
| --- | --- | --- | --- |
| `docs/epcc-profit-ingestion.md` | The opening cron paragraph contains the old `0 10 * * *` schedule. | The document explicitly labels it obsolete and records the repository schedule of 08:05/08:15 UTC. | No schedule correction remains; retain the historical qualification. |
| `docs/planning/WEEK_3_JULY_STATUS.md` | The historical record lists 10:05/10:15 SAST and an old test-process claim. | The document is explicitly historical and now includes the subsequent type/schema/observability resolution. | Preserve the historical values; use the canonical context for current operations. |
| `docs/sales-dashboard-tv-settings-plan.md` | TV migrations are staged/unapplied and implementation is future work. | TV tables/RPC migrations, generated types, repository, actions, settings route, form, and tests exist. | Replace with current operational documentation or archive as completed plan. |
| `docs/sales-dashboard-plan.md` | Describes a planned date-range/lead dashboard architecture and files such as `getSalesDashboardData.ts`. | Current implementation is Supabase-first KPI/dashboard architecture; several proposed files do not exist and `DateRangeFilter.tsx` is unused. | Mark historical/replace with current architecture and current source ownership. |
| `docs/best-practice-checklist.md` | Mentions typed date-range filtering and lead-source dashboard concepts as current standards. | Current dashboard uses year/month route parameters and no active `DateRangeFilter`. | Align checklist to the implemented dashboard or explicitly call these deferred. |
| `docs/database-foundation.md` | Foundation migration should be applied “when ready.” | It is the first repository migration and current app relies on its tables/access model. | Mark as historical migration reference and link canonical context. |
| `docs/planning/CALCULATOR_SUPABASE_SCHEMA.md` | Some lower sections still constrain `garment_type` to three values and present pre-implementation recommendations. | Current migrations include `OTHER`, Product Types, invoice fields, and later normalized markup work. | Keep the top source-of-truth warning, but remove/annotate superseded lower recommendations. |
| `README.md` | Local setup lists only public Supabase variables. | `.env.example` also requires/defines service-role, Monday, Gmail, and cron variables for relevant operations. | Link to `.env.example` and document server-only operational configuration. |
| `docs/ai-context/PROJECT_CONTEXT.md` | Some “remaining production verification” statements coexist with recorded successful 2026-08-03 validation. | The document itself records that validation and current Vercel schedules. | Separate historical observations from currently outstanding actions; retain source-delta/alerting work as current. |

## Intentionally Retained Code

- **`src/features/sales-dashboard/data/workbookFixture.ts`:** Runtime historical fallback used by `salesDashboardRepository.ts`; Supabase data takes precedence, but removing it would change missing-period/member behaviour.
- **Monday audit/manual-sync tooling:** `scripts/audit-monday-sales-history.ts`, `scripts/sync-monday-sales-dashboard.ts`, `scripts/lib/monday/*`, 2025 restoration audit, cleanup tooling, and generated audit outputs support manual reconciliation, board discovery, bounded sync, and source-safety investigation. They are not normal route imports, but are documented operational entry points.
- **EPCC ingestion/audit tooling:** Gmail client, parser, importer, cron, EML fixtures, audit-reader migration, and duplicate/backfill logic preserve production reconciliation and secure source ownership.
- **Deferred EU Trade references:** Planning/legacy documents establish that no active EU Trade route/profile/formula should be introduced until business rules are confirmed. Retain as decision evidence; do not treat their lack of route imports as dead code.
- **Transitional `garment_type`:** Retained for legacy markup compatibility and synchronized Product Type mapping until pricing-category migration is complete.
- **Generated database types:** `src/types/database.types.ts` is used by repositories and Supabase clients and was regenerated from the current remote public schema on 2026-08-11. The retained legacy table remains represented because it still exists remotely.
- **Historical migrations:** Applied migrations, including restoration/overlapping forward migrations, are immutable deployment history rather than removable application code.
- **`sales_kpi_profit_email_sources` schema-drift references:** Its obsolete ingestion RPC overload is retired. The table and historical metadata row remain intentionally retained and represented in generated types; do not drop them without a separate retention decision.
- **Calculator reference assets:** The three current reference images document delivery/breakdown behaviour; they are retained as implementation references even though no route renders them.
- **Archived screenshots:** Preserve as audit/design history pending an explicit retention decision; they have no runtime imports but are not safe to delete based on static use alone.
- **Shared loading, error, empty, feedback, and copy components:** They are active shared infrastructure and App Router convention supports route-specific state files without ordinary imports.
- **Source metadata and reconciliation identities:** Canonical member maps, protected metadata, aliases, and generated reconciliation reports are essential to Monday/EPCC provenance and historical correction.

## Prioritised Cleanup Plan

### Batch 1 — Safe dead-code and dependency cleanup

- **Exact scope:** Remove the seven unreachable modules and three unused direct Radix dependencies listed in Confirmed Safe Removals; update lockfile; remove only stale prose that directly claims those files are active.
- **Risk:** Low.
- **Dependencies:** No new packages, database changes, migration changes, or deployment changes.
- **Behaviour-preservation requirements:** Preserve current EU/UK calculators, dashboard KPI views, all active exports, App Router routes, current assets, and all manual tooling.
- **Items requiring approval before implementation:** Standard approval to delete the named files and change `package.json`/lockfile. Do not include archived assets, scripts, migrations, fixtures, or planning archives without separate approval.

### Batch 2 — Architecture and duplication refactors

- **Exact scope:** Access preflight before page data loads; typed Supabase write/RPC payloads; consolidated cron envelope if proven equivalent; shared data-management mutation guard; route formatting consistency; reduce duplicate KPI presentation only where current components overlap.
- **Risk:** Medium to high, especially access guard ordering and Monday/EPCC write payloads.
- **Dependencies:** A current generated-type/schema contract and focused tests before/after each change.
- **Behaviour-preservation requirements:** RLS remains authoritative; source ownership stays field-level; cron schedules/failure independence/locks remain; calculator totals/formulas/copy stay identical; server/client boundaries stay intact.
- **Items requiring approval before implementation:** Any changes touching access resolution, cron handlers, generated types, service-role usage, source metadata, or source-owned payloads.

### Batch 3 — Tests and documentation alignment

- **Exact scope:** Add a unified test command; include all source/script tests in verification; add route/access and server-action coverage; migrate selected brittle UI source-string tests; correct current docs and archive/label historical plans.
- **Risk:** Low to medium; test selection can expose latent failures.
- **Dependencies:** Agree on the supported test command and whether historical plans are archived, rewritten, or annotated.
- **Behaviour-preservation requirements:** Do not weaken legacy business-rule regression coverage, source-isolation tests, migration contract tests, or historical audit evidence.
- **Items requiring approval before implementation:** Any broad documentation deletion/relocation and any change to the official operational verification command.

## Questions Requiring Confirmation

1. What retention period should apply to the intentionally retained `sales_kpi_profit_email_sources` row, and when is final table cleanup approved? This no longer blocks application code or type generation.
2. Is `allowedDevOrigins: ["192.168.3.34"]` still required for active LAN development, and has the Turbopack HMR issue been rechecked?
3. Should current cron documentation standardize on the repository schedule (08:05/08:15 UTC), and does production Vercel match it today?
4. Is the planned cleanup allowed to remove only the 10 named safe items, leaving archived screenshots and historical/planning documents untouched until a separate retention decision?
5. Before any multi-organisation work, should the fixed Pins & Knuckles cron organisation remain explicit or be redesigned with an approved tenancy model?

## Final Recommendation

Approve Batch 1 first. It is bounded, evidence-backed, and independent of migrations, RLS, production data, and business calculations. Immediately after it, implement Batch 3's unified test command and operational-documentation corrections. Treat Batch 2 as a separately reviewed hardening effort, especially the access and source-owned Supabase write paths.
