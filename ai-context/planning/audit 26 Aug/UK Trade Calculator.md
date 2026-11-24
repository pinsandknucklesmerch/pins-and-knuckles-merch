# UK Trade Calculator

**Route:** `/hub/calculators/uk/trade`

## Purpose

Build UK Trade apparel quotes from UK-specific reference pricing.

## Current state

* Loads shared UK Trade reference data and renders `UkTradeCalculator` in `CalculatorShell`.
* Uses the UK Trade domain for GBP pricing, quantity-tier lookup, decoration/setup fees, VAT, and quote breakdowns; draft state remains client-local.
* Requires ordinary Hub access and renders a bounded unavailable state on reference-data failure.

## Issues / unfinished work

* Route orchestration is compressed into one line and duplicates the common calculator load/error pattern.
* It loads before the visible shell access decision; RLS remains the data boundary.

## Decisions already made

* Preserve minimum quantity 50, floor tiers, 20% VAT, UK setup-fee treatment, and maximum 10 colours.
* Preserve underbase logic for non-white standard prints and configured embroidery block normalisation; calculation rules belong in the UK Trade domain.

## Decisions still needed

No material unresolved decisions identified.

## Status

🟡 Needs work — the domain implementation is established; route duplication/readability is technical debt.

