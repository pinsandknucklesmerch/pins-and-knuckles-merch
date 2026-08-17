# Database Schema Reference

This is an explanatory, migration-derived reference. `supabase/migrations/` is
authoritative; `src/types/database.types.ts` is a generated schema snapshot.
Neither this document nor the repository can prove the state of a remote
Supabase project.

## Identity and access

- `profiles`: application profile associated with a Supabase Auth user.
- `organisations`: shared organisation records.
- `organisation_members`: user membership, organisation role, active state,
  and optional Monday member identity.
- `app_access`: app-specific access level per membership, including `pins_hub`.

Foundation functions/policies support own-profile access, organisation-member
reads, and Pins Hub access checks. Organisation roles and app access are
separate concepts.

## Calculator and reference data

- `garments`: global/reference garment catalogue with EUR/GBP pricing and
  transitional `garment_type`.
- `product_types`: category/pricing direction plus invoice/customs defaults.
- `calculator_profiles`, `calculator_pricing_sets`, and
  `calculator_profile_price_sets`: active calculator profiles and pricing-set
  selection.
- `calculator_garment_markups`: profile-specific garment markup values.
- `eu_print_price_tiers`, `uk_trade_print_price_tiers`,
  `eu_embroidery_pricing`, and `uk_trade_embroidery_pricing`: decoration tiers.
- `calculator_fees` and `delivery_rates`: configured fees and EU delivery data.

Global reference rows generally use `organisation_id IS NULL`; do not infer a
general organisation-specific pricing model from nullable columns.

## Sales Dashboard and ingestion

- `sales_kpi_months`: persisted company/month KPI values and provenance.
- `sales_kpi_member_months`: persisted member/month KPI values with distinct
  Monday and EPCC metadata.
- `sales_kpi_targets`: effective-dated dashboard targets.
- `sales_kpi_month_final_values`: independent admin final-value overrides.
- `sales_dashboard_tv_settings`: organisation-scoped TV slide settings.
- `sales_kpi_monday_sync_locks`: per-organisation/year/month Monday sync lock
  state.
- `sales_kpi_profit_email_ingestions`: EPCC ingestion/audit records.
- `sales_kpi_profit_email_sources`: retained legacy historical table; schema
  presence does not imply active application use.
- `cron_run_history`: scheduled-job status, period, duration, and sanitized
  diagnostics metadata/errors.

## Commercial invoice directories

- `invoice_companies`: organisation-scoped sender/receiver directory records.
- `invoice_products`: invoice-product directory table present in the schema.
- `product_types`: also contains invoice defaults such as origin, description,
  default cost, and currency.

Schema presence does not imply that every table is a primary current UI source.
The current Commercial Invoice flow uses directory selection and Product Type
defaults but keeps invoice drafts themselves in memory.

## Developer/support tooling

- `hub_feedback_reports`: user-submitted feedback with developer workflow
  state/notes.
- `developer_diagnostic_issues`: persisted Snuggle diagnostic issues, status,
  occurrence/detection lifecycle, and developer notes.

## MerchBuddy foundation

The Pins Hub Supabase project contains the Phase 1 MerchBuddy data foundation:
organisation-scoped customers, contacts, account managers, tours, tour users,
products, variants, and shows. Its migration also adds MerchBuddy access and
tour-management helper functions, indexes/triggers, RLS policies, and
authenticated grants. This repository does not contain MerchBuddy application
screens or mobile code; the Expo/React Native application is maintained in a
separate repository.

## Significant application-facing functions

- `has_pins_hub_access` and `has_pins_hub_access_for_organisation`: access
  predicates used by policies and application access decisions.
- `has_pins_hub_developer_access` and
  `has_pins_hub_developer_access_for_organisation`: developer-area predicates.
- `ingest_epcc_monthly_profit_and_members`: active service-role EPCC ingestion
  RPC for company profit and member snapshots.
- `try_acquire_monday_sales_sync_lock` and
  `release_monday_sales_sync_lock`: service-role Monday cron locking.
- `save_sales_dashboard_tv_settings` and
  `reset_sales_dashboard_tv_settings`: authenticated TV settings mutation RPCs.
- `submit_hub_feedback_report`, `update_hub_feedback_report`, and
  `update_developer_diagnostic_issue`: feedback/diagnostic workflow RPCs.

`ingest_epcc_monthly_profit` is a retired legacy overload and is not active
application behavior.

## RLS and service-role boundaries

Migrations enable RLS for core and feature tables. Authenticated users receive
organisation-scoped reads and writes constrained by Pins Hub access levels;
write/admin actions have additional server-side checks. Cron, external
ingestion, invitation/provisioning, and privileged diagnostics use server-only
service-role code because they require capabilities not available to browser
clients.

Review migrations for exact policy/grant semantics. Remote application state,
service-role grants, RLS policies, and function availability require separate
operational verification.
