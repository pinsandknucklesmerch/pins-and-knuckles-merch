# Invoice Companies

**Route:** `/hub/data/invoice-companies`

## Purpose

Maintain organisation-scoped sender/receiver directory records for commercial invoices.

## Current state

* Loads companies from the invoice-company repository and renders `InvoiceCompaniesManager` with effective Hub access.
* Supports create, edit, active/inactive, and delete operations through server actions constrained to the active organisation and RLS.
* The Commercial Invoice Generator uses active records as directory choices.

## Issues / unfinished work

* There is no focused server-action test suite proving all read/write/admin and cross-organisation paths.
* Route loading precedes visible AppShell access denial.

## Decisions already made

* Keep companies organisation-scoped; do not treat them as global calculator reference data.
* Preserve write-user editing/adding and admin activation/deletion boundaries, with RLS as the security boundary.
* Reuse invoice directory validation/mappers for the generator and manager.

## Decisions still needed

No material unresolved decisions identified.

## Status

🟡 Needs work — the active workflow is bounded, with incomplete focused authorization coverage.

