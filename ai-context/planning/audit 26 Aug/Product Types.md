# Product Types

**Route:** `/hub/data/product-types`

## Purpose

Maintain product-type categories, calculator direction, and invoice defaults.

## Current state

* Loads Product Types from the shared catalog repository and renders `ProductTypesManager` with effective access level.
* Server actions validate and persist create/update/delete behaviour; actions check relationships before deletion and RLS remains final enforcement.
* Product Types are consumed by garment management and commercial-invoice defaults.

## Issues / unfinished work

* Some historical planning/schema documents describe earlier constraints and recommendations that no longer match later migrations.
* As with other data pages, loading occurs before visible AppShell denial.

## Decisions already made

* Keep Product Types as the authoritative active category/default directory for invoice and garment workflows.
* Preserve pricing categories and validation in data-management types/actions rather than duplicating them in forms.
* Do not remove transitional garment compatibility merely because Product Types now exist.

## Decisions still needed

No material unresolved decisions identified.

## Status

🟡 Needs work — the page is implemented, but documentation and transitional model history need careful handling.

