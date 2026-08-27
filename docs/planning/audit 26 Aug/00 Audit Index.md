# Pins Hub Audit — 26 August 2026

## Audit Summary

28 meaningful user-facing pages were audited.

* ✅ Good / stable: 14
* 🟡 Needs work: 14
* 🔴 Problem: 0

Pins Hub is structurally healthy: it has a coherent Next.js/Supabase feature architecture, explicit access model, shared domain implementations, and mostly compact operational UI. The needs-work findings are concentrated in deliberate technical debt and operational verification rather than confirmed broken core workflows; the highest-value future work is to resolve data/access ordering, historical-data boundaries, and external integration semantics without weakening the existing source-of-truth rules.

## Page Index

| Page | Route | Status | Main finding |
| ---- | ----- | ------ | ------------ |
| [Hub / Home](Hub%20Home.md) | `/hub` | 🟡 Needs work | Shared launcher is sound, but temporary contradictory request diagnostics remain. |
| [Sales Dashboard](Sales%20Dashboard.md) | `/hub/sales-dashboard` | 🟡 Needs work | Mature persisted KPI dashboard with intentional historical fallback and access-order debt. |
| [Sales Dashboard TV Settings](Sales%20Dashboard%20TV%20Settings.md) | `/hub/sales-dashboard/tv/settings` | ✅ Good / stable | Admin-only persisted TV configuration is implemented; its old plan is stale. |
| [Analytics](Analytics.md) | `/hub/analytics` | 🟡 Needs work | Live server-side GA4 works in principle; social reporting remains pending. |
| [Calculators](Calculators.md) | `/hub/calculators` | ✅ Good / stable | Compact index exposes only the four active regional calculators. |
| [EU Standard Calculator](EU%20Standard%20Calculator.md) | `/hub/calculators/eu/standard` | 🟡 Needs work | Shared EU engine is established, with pre-shell loading and parity verification debt. |
| [EU US Clients Calculator](EU%20US%20Clients%20Calculator.md) | `/hub/calculators/eu/us-clients` | 🟡 Needs work | Correctly reuses the EU engine but duplicates route orchestration. |
| [UK Trade Calculator](UK%20Trade%20Calculator.md) | `/hub/calculators/uk/trade` | 🟡 Needs work | UK domain rules are isolated; route readability and access ordering need care. |
| [UK Standard Calculator](UK%20Standard%20Calculator.md) | `/hub/calculators/uk/standard` | 🟡 Needs work | Dedicated calculator is active, with minor route-structure debt. |
| [PK Tax](PK%20Tax.md) | `/hub/pk-tax` | ✅ Good / stable | Tested calculation-only allocation surface with no persistence scope. |
| [Commercial Invoices](Commercial%20Invoices.md) | `/hub/commercial-invoices` | 🟡 Needs work | Draft-only browser exports are clear; persistence and export parity remain decisions. |
| [Data Management](Data%20Management.md) | `/hub/data` | ✅ Good / stable | Clear live-count index for the three active reference directories. |
| [Garment Directory](Garment%20Directory.md) | `/hub/data/garments` | 🟡 Needs work | Active directory retains intentional transitional `garment_type` debt. |
| [Product Types](Product%20Types.md) | `/hub/data/product-types` | 🟡 Needs work | Active category/default directory is affected by stale historical planning docs. |
| [Invoice Companies](Invoice%20Companies.md) | `/hub/data/invoice-companies` | 🟡 Needs work | Organisation-scoped management works, but authorization coverage is thin. |
| [Profile](Profile.md) | `/hub/profile` | ✅ Good / stable | Bounded self-service profile reuses the shared member-performance model. |
| [User Access Management](User%20Access%20Management.md) | `/hub/team` | 🟡 Needs work | Access semantics are explicit, with per-member lookup and typing debt. |
| [Add User](Add%20User.md) | `/hub/team/add` | ✅ Good / stable | Privileged provisioning is correctly server-only; delivery needs remote verification. |
| [User Profile](User%20Profile.md) | `/hub/team/[membershipId]` | ✅ Good / stable | Focused admin detail screen reusing shared performance logic. |
| [Developer](Developer.md) | `/hub/developer` | ✅ Good / stable | Narrow developer-only entry point with persisted counts. |
| [Developer Feedback](Developer%20Feedback.md) | `/hub/developer/feedback` | ✅ Good / stable | Protected persisted feedback workflow; filter normalisation is less explicit. |
| [Developer Diagnostics](Developer%20Diagnostics.md) | `/hub/developer/diagnostics` | 🟡 Needs work | Useful operations view with unresolved cron semantics and render-time synchronisation. |
| [Login](Login.md) | `/login` | ✅ Good / stable | Straightforward public sign-in backed by server-side Hub protection. |
| [Auth Link Failed](Auth%20Link%20Failed.md) | `/auth/error` | ✅ Good / stable | Minimal common auth failure page that avoids sensitive detail. |
| [Forgot Password](Forgot%20Password.md) | `/auth/forgot-password` | ✅ Good / stable | Correct local reset flow; remote delivery/redirects remain unverified. |
| [Invite Confirmation](Invite%20Confirmation.md) | `/auth/invite` | 🟡 Needs work | Supports PKCE and legacy fragments, retaining compatibility complexity. |
| [Recovery Confirmation](Recovery%20Confirmation.md) | `/auth/recovery-confirm` | ✅ Good / stable | Server-mediated token validation and recovery-session creation. |
| [Update Password](Update%20Password.md) | `/auth/update-password` | ✅ Good / stable | Secure mode-specific recovery and invitation completion page. |

## Project-Wide Findings

### Access decision occurs after some feature loading

**Affected areas:** Sales Dashboard, all four calculator pages, Commercial Invoices, Garment Directory, Product Types, Invoice Companies.

**Current state:** These routes begin feature/reference loading before their visible `AppShell` access result. Supabase RLS remains the security boundary, so this is avoidable work rather than evidence of data exposure.

**Future constraint / recommendation:** Preserve RLS and current access semantics. Any future hardening should resolve access before expensive feature loads without altering the denied-user experience.

### Historical/remote verification boundaries remain material

**Affected areas:** Sales Dashboard and Profile/User Profile performance, Analytics, Commercial Invoices, calculator exports, Developer Diagnostics, Add User and authentication workflow.

**Current state:** Dashboard historical fallback is intentionally live; GA4, Auth mail delivery, external integrations, exports, and cron records require live operational verification beyond source review.

**Future constraint / recommendation:** Do not replace missing data with invented values or remove retained fallback data until coverage is confirmed. Keep repository evidence separate from live-service verification.

### Shared operational patterns need consistency rather than parallel reinvention

**Affected areas:** Calculator routes, Data Management, User Access Management, Developer Feedback/Diagnostics.

**Current state:** Core domains are shared, but some route orchestration, action access/result handling, and request-filter parsing vary or are duplicated.

**Future constraint / recommendation:** Extend existing repositories, domain modules, access helpers, and shared controls where a genuine common behaviour exists; avoid page-specific copies of business rules or permission logic.

### Historical documentation can conflict with the active implementation

**Affected areas:** Sales Dashboard TV Settings, Product Types, calculators, and planning documentation generally.

**Current state:** Some older plans describe completed or superseded behaviour, while source and forward-only migrations show the active state.

**Future constraint / recommendation:** Treat current source and migrations as authoritative. Retain historical documents as evidence only when clearly labelled, rather than using them to restore removed/deferred functionality.

## Established Project Decisions

### Architecture and data ownership

* Use the Next.js App Router, feature-based modules, SSR Supabase client, and forward-only migrations; keep routes thin.
* Use persisted Supabase data as the Sales Dashboard rendering source. Monday and EPCC are ingestion sources, not page-request dependencies.
* Calculator reference data is Supabase-owned while calculator drafts are client-local. Commercial invoices are in-memory drafts, not persisted records.

### Access and security

* Treat RLS, server-side checks, and server-only privileged clients as the security boundary; hidden UI is never sufficient authorization.
* Keep organisation role distinct from Pins Hub access level. Preserve owner effective-admin capability and stronger owner/developer provisioning controls.
* Keep recovery verification server-mediated, local redirects safe, and privileged provisioning/Admin API capabilities off the browser.

### UI and interaction patterns

* Preserve the compact, dark operational shell, shared `AppShell`, `PageHeader`, state components, compact controls, keyboard focus, and reduced-motion support.
* Reuse `MagicBento` for navigation/actionable cards only, not dense forms or calculation surfaces.
* Keep Home and directory index pages as launchers rather than duplicate dashboards or mixed edit surfaces.

### Shared domain logic

* Reuse calculator repositories, mappers, and EU/UK domain rules; do not recreate price/calculation logic in page UI.
* Reuse shared member-performance presentation and dashboard calculation contracts across Sales Dashboard, Profile, and User Profile.
* Keep PK Tax calculation-only and preserve its tested fixed allocations, pool weights, and deterministic cents handling.

### Integrations and external data

* Website analytics is server-only live GA4 reporting with no persistence; do not expose credentials or invent social metrics.
* Preserve field-level sales ownership: Monday owns quote/order/conversion fields, while EPCC owns profit/member profit and PK Tax from July 2026 onward.
* Keep cron history observational and sanitized; diagnostics are indicators, not proof of root cause.

### Reporting and exports

* Preserve dashboard route-backed month/year and TV query state, persisted final-value overrides, and established report presentation helpers.
* Keep invoice XLSX/PDF exports browser-generated from the validated in-memory draft until durable invoice workflow is deliberately approved.

### Navigation and page structure

* Use `hubFeatureNavigation` as the shared primary navigation source. Keep Profile near sign-out and admin/developer areas separately role-gated.
* Keep only active calculator routes exposed; do not reintroduce EU Trade or Invoice Products based solely on historical/schema references.

## Unresolved Decisions

* **Decision required:** Confirm the repeated `/hub` request cause and remove temporary request diagnostics. **Affected pages:** Hub / Home. **Why it matters:** Current logging is temporary, contradictory, and can duplicate request metadata.
* **Decision required:** Define the approved social/Meta integration, source, metrics, and access model. **Affected pages:** Analytics. **Why it matters:** The current social view is intentionally not live reporting.
* **Decision required:** Confirm persisted KPI coverage and decide whether to bound or retire the historical workbook fallback. **Affected pages:** Sales Dashboard, Profile, User Profile. **Why it matters:** It determines future reporting correctness and retained technical debt.
* **Decision required:** Decide whether commercial invoices need durable history/workflow. **Affected pages:** Commercial Invoices, Invoice Companies. **Why it matters:** Current in-memory drafts and browser exports deliberately provide no record lifecycle.
* **Decision required:** Decide cron-history retention/alerting and whether business-rejected Monday syncs should be failed/stale. **Affected pages:** Developer Diagnostics, Sales Dashboard. **Why it matters:** Current status semantics limit what operational warnings can prove.
* **Decision required:** Confirm completion criteria for garment identity, Generic Hoodies, and pricing-category reconciliation. **Affected pages:** Garment Directory, Product Types, calculators. **Why it matters:** `garment_type` remains required compatibility data until that migration is complete.

## Recommended Review Order

1. Sales Dashboard and Sales Dashboard TV Settings — business-critical KPIs, source ownership, overrides, historical fallback, and TV configuration.
2. Developer Diagnostics and Analytics — operational data freshness, external integration boundaries, and unresolved monitoring/social decisions.
3. Calculator index and four calculator pages — pricing-domain constraints, shared-engine reuse, reference data, and export verification.
4. Commercial Invoices, Invoice Companies, Product Types, and Garment Directory — draft/persistence boundary, reference-data ownership, and transitional garment model.
5. PK Tax — confirm the calculation-only scope and fixed allocation rules.
6. Hub / Home — resolve temporary request diagnostics after the core data surfaces are understood.
7. User Access Management, Add User, User Profile, and Profile — access model, provisioning, activity semantics, and shared performance display.
8. Developer Feedback — supporting operational workflow and filter consistency.
9. Login, password recovery, invite confirmation, recovery confirmation, update password, and auth error — stable auth flows and remaining remote delivery verification.
