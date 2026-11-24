# PK Tax

**Route:** `/hub/pk-tax`

## Purpose

Interactive allocation calculator for PK Tax and associated performance pool.

## Current state

* Renders client-side `PkTaxCalculator`, backed by tested `calculatePkTax` and export helpers.
* Inputs are normalised so non-finite and negative values become zero; results include fixed allocations, Johan allocation, and weighted performance-pool allocations.
* It is calculation-only: no Supabase write, invoice, or historical persistence.

## Issues / unfinished work

* Domain coverage is stronger than rendered/UI integration coverage for validation, reset, and copy/export interactions.

## Decisions already made

* Preserve fixed overall allocations: EPCC 40%, admin 10%, marketing 5%, operations 5%.
* Preserve the pool and weighting rules in the domain: contributor PK Tax plus Snuggle profit, allocated in cents with deterministic remainder handling.
* Do not turn this page into persisted tax accounting without a deliberate product decision.

## Decisions still needed

No material unresolved decisions identified.

## Status

✅ Good / stable — the calculation is isolated and tested; only UI-level coverage is comparatively thin.

