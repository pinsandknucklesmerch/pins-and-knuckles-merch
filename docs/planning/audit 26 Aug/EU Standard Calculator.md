# EU Standard Calculator

**Route:** `/hub/calculators/eu/standard`

## Purpose

Build an EU Standard apparel quote from live calculator reference data.

## Current state

* Loads `EU_STANDARD` data through the shared calculator repository and renders `EuCalculator` inside `CalculatorShell`.
* The calculator handles garment selection, quantity, print/embroidery options, fees, optional PK markup, VAT, quote formatting, and optional separate delivery calculation.
* Pricing/reference rows come from Supabase; quote draft state is client-local. Errors render `ErrorState` rather than fabricated values.

## Issues / unfinished work

* This route loads reference data before `AppShell` makes the access decision; RLS is still authoritative.
* Business-approved calculator/export parity remains an outstanding operational verification item.

## Decisions already made

* Reuse the EU domain/repository/mappers; do not duplicate pricing rules in UI.
* Preserve numeric colour normalisation, one-colour default, EU maximum of nine, signed optional per-unit PK markup, and delivery exclusion from quote totals.
* Keep calculator drafts local; reference data is Supabase-owned.

## Decisions still needed

No material unresolved decisions identified.

## Status

🟡 Needs work — the implementation is established, with access-order and parity-verification debt.

