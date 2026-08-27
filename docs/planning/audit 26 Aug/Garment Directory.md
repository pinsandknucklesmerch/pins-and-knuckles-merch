# Garment Directory

**Route:** `/hub/data/garments`

## Purpose

Maintain the garment reference catalogue used by calculators.

## Current state

* Loads garments and Product Types through the shared catalog repository and renders `GarmentsManager`.
* Supports read/display and permission-sensitive create/edit/deactivation workflows through data-management actions and Supabase RLS.
* Passes effective Pins Hub access level into the client manager; `garments` remain global/reference rows and connect to Product Types.

## Issues / unfinished work

* `garment_type` remains a transitional compatibility field; generic hoodie/material reconciliation and garment identity review are incomplete.
* Route-level data loading precedes visible AppShell denial, although RLS protects the query.

## Decisions already made

* Preserve `garment_type` until the pricing-category migration is explicitly complete; do not delete it as apparent legacy data.
* Use Product Types as the evolving category/default relationship and retain shared sortable-table/form patterns.
* Continue distinguishing read, write, and admin behaviour server-side/RLS-side rather than relying on hidden controls.

## Decisions still needed

Decide when garment identity and Generic Hoodies reconciliation are complete enough to retire transitional behaviour.

## Status

🟡 Needs work — active directory with deliberate transitional data-model debt.

