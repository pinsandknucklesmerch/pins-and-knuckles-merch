# Database Schema Reference

This document describes the logical schema represented by the current repository. The forward-only SQL migrations in `supabase/migrations/`, together with current source usage, are the authority for exact tables, columns, constraints, functions, policies, and grants. This reference groups that schema by responsibility instead of reproducing every migration.

Repository evidence proves schema intent, not the state of a remote Supabase project. A migration file may exist without having been applied. `src/types/database.types.ts` is a generated compile-time snapshot and may lag migration history; it is not deployment evidence. Confirm remote migration, policy, grant, function, and data state operationally when that distinction matters.

Some schema is shared with the separate Pins Merch App. This repository contains the shared migrations but not that application's source, so changes to shared identity, access, organisation, Band, Tour, product, show, or inventory structures require cross-application consideration.

## Identity, organisations, and application access

- `profiles` is the application profile for a Supabase Auth user and includes application-facing identity and activity metadata.
- `organisations` represents organisations shared by the applications.
- `organisation_members` links profiles to organisations. It owns the organisation role and membership lifecycle state; a user can have memberships in more than one organisation.
- `app_access` attaches application-specific access to an organisation membership rather than directly to a user. The repository defines access for `pins_hub` and `merchbuddy`, with the current access hierarchy including `read`, `write`, `admin`, and `developer`.

Organisation role, membership state, and application access are distinct inputs to authorization. Current Pins Hub helpers also give an active organisation owner effective Hub administration, while developer capability remains an explicit higher access level. Pins Merch access helpers include the repository-defined Pins Hub inheritance path. Exact effective-access behavior belongs to the current helper functions and policies, not to assumptions based on one column.

The foundation also provides shared profile/membership predicates, updated-at behavior, and Auth profile provisioning. Privileged account invitation, membership, profile, and access changes are performed through server-side application boundaries; browser visibility is not authorization.

## Garments, product types, and calculator reference data

The pricing calculators and data-management features use a repository-backed reference model:

- `garments` is the garment catalogue, including product identity, pricing, classification, and active state.
- `product_types` provides product categorisation and pricing direction and also carries commercial-invoice/customs defaults used by current application flows.
- `calculator_profiles`, `calculator_pricing_sets`, and `calculator_profile_price_sets` define supported calculator configurations and their pricing sources.
- `calculator_garment_markups` stores effective-dated markup rules.
- `eu_print_price_tiers`, `uk_trade_print_price_tiers`, `eu_embroidery_pricing`, and `uk_trade_embroidery_pricing` store decoration pricing.
- `calculator_fees` and `delivery_rates` store applicable fees and EU delivery reference data.

Current calculator reference rows are generally global rows with `organisation_id IS NULL`. Nullable organisation columns in these tables are not, by themselves, evidence of a general organisation-specific pricing model. Seed and normalization migrations form part of the repository definition, but their presence does not prove remote data was loaded.

## Sales Dashboard, KPI, and ingestion data

- `sales_kpi_months` stores company/month KPI values, source/provenance information, and later Monday and sales-inbox fields.
- `sales_kpi_member_months` stores member/month KPI values while keeping Monday-owned and EPCC-owned inputs distinguishable.
- `sales_kpi_targets` stores effective-dated dashboard targets.
- `sales_kpi_month_final_values` stores independent administrator final-value overrides for supported metrics.
- `sales_dashboard_tv_settings` stores organisation-scoped TV slide configuration.
- `sales_kpi_profit_email_ingestions` records EPCC email-ingestion identity and audit data.
- `sales_kpi_monday_sync_locks` is service-side coordination state for Monday synchronization.
- `cron_run_history` records scheduled-job period, status, timing, summaries, sanitized errors, and metadata for the EPCC and Monday jobs.

The active EPCC ingestion path is the service-role `ingest_epcc_monthly_profit_and_members` RPC. The older `ingest_epcc_monthly_profit` overload was explicitly retired. Monday lock functions and the TV settings save/reset RPCs support their corresponding server-side workflows. Source code remains authoritative for which fields each integration owns.

`sales_kpi_profit_email_sources` is legacy historical schema referenced by the retirement migration as intentionally retained, but it is not used by the current ingestion path and its creation is not represented in this repository's migration sequence. Its presence and retained data in any remote project therefore require operational verification; generated types alone are not proof.

## Reporting and template persistence

`epcc_report_templates` stores one organisation-scoped JSON template with update attribution. It persists the reporting template configuration; generated report files and other browser export artifacts are not implied to be database records.

## Commercial invoice directories

- `invoice_companies` stores organisation-scoped company/address directory entries.
- `invoice_products` is a retained invoice-product directory defined by the schema.
- `product_types` also contains the product/customs defaults used by the current Commercial Invoice feature.

Schema presence does not prove that a table is the current UI's primary source. Current source uses Invoice Companies and Product Types for the invoice workflow; `invoice_products` remains repository-defined but is not the current product selection path. Invoice drafts and export history are not persisted by this schema.

## Quick Reference

`quick_reference_records` persists ordered, categorised reference entries with body text, an optional warning, and active state. The migration scopes records to the canonical Pins & Knuckles organisation, seeds the initial reference set, and applies access-level-aware RLS and lifecycle rules. Current Pins Hub source reads these records and provides management actions; this is not browser-local persistence.

## Developer feedback and diagnostics

- `hub_feedback_reports` stores user-submitted issue reports, workflow status, resolution information, and developer notes.
- `developer_diagnostic_issues` stores detected diagnostic issues, occurrence and detection lifecycle data, affected item/member references, workflow status, and developer notes.
- `cron_run_history`, described above, is also part of the developer diagnostics surface.

Developer-only predicates and restricted RPCs protect diagnostic reads and workflow updates. User feedback submission is exposed through its narrower authenticated RPC rather than broad client-side table mutation.

## Shared Pins Merch / Band-first schema

The original Merch foundation was organisation-first. Later migrations retain its physical table names while changing the logical ownership model to Band-first:

- `merchbuddy_customers` is the retained physical Band/workspace table. Its `organisation_id` is nullable legacy compatibility metadata, not the canonical owner relationship.
- `merchbuddy_tours` belongs canonically to a Band through `customer_id`. Its nullable `organisation_id` is also retained compatibility metadata.
- `merchbuddy_customer_contacts` and `merchbuddy_customer_account_managers` store Band-related contact and account-management metadata. Account-manager association is not an authorization grant.
- `merchbuddy_products` belongs to a Tour; `merchbuddy_product_variants` belongs to a product; `merchbuddy_shows` belongs to a Tour.
- `merchbuddy_show_inventory_counts` stores per-show, per-variant count-in/count-out state and enforces that the show and variant resolve to the same Tour.

Band-wide access is modelled independently of legacy organisation ownership:

- `merchbuddy_band_members` stores direct Band roles (`viewer`, `staff`, `manager`, or `owner`) and soft-revocation state.
- `merchbuddy_band_invitations` supports the direct-member invitation and acceptance lifecycle.
- `merchbuddy_band_organisations` stores a pending, active, or revoked relationship between a Band and an organisation.
- `merchbuddy_band_organisation_assignments` explicitly assigns an eligible organisation member to one of those relationships with a non-owner Band role. Organisation membership or application access alone does not grant access to every related Band.

The Band permission helpers resolve the highest valid direct or explicitly assigned role. The authorization cutover applies Band-first predicates to Tours, products, variants, shows, inventory, contacts, and related operational data. Transactional RPCs cover Band creation, direct membership and ownership, organisation relationship and assignment administration, and Band lifecycle changes.

`merchbuddy_tour_users` is retained as frozen, revocable, exact-Tour legacy compatibility. It does not create Band-wide membership. Legacy organisation columns and access rows should not be repurposed as the target authorization model merely because they remain physically present.

These migrations define shared backend behavior for Pins Merch App, but this repository alone cannot establish whether the remote migration sequence is applied or whether the separate client has completed a corresponding Band-first rollout.

## Security and operational interpretation

RLS is enabled across the application-facing feature tables, with access expressed through organisation-, application-, developer-, Tour-, or Band-aware predicates as appropriate. Service-role grants and `SECURITY DEFINER` RPCs are used for narrowly privileged ingestion, provisioning, synchronization, and access-administration operations. Client code must use the established browser/SSR/server boundaries and must not reproduce authorization rules locally.

For an exact change, read the full migration sequence rather than only the table-creation migration: later migrations alter constraints, columns, accepted values, functions, grants, and policies. Historical compatibility structures are described above only where later migrations explicitly retain them. Remote availability and production data always require separate operational evidence.
