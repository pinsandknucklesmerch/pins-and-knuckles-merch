# UK Standard Calculator

**Route:** `/hub/calculators/uk/standard`

## Purpose

Build UK Standard quotes using its dedicated calculator/profile behaviour.

## Current state

* Loads UK Standard reference data via the shared calculator repository and renders `UkStandardCalculator` within `CalculatorShell`.
* Uses a client-local draft and server-loaded Supabase reference data; errors render the standard calculator unavailable state.
* Requires ordinary Hub access through the shell.

## Issues / unfinished work

* As with the other calculator routes, reference loading occurs before the visible shell access check.
* The compressed route format is less maintainable than the EU Standard route.

## Decisions already made

* Keep UK Standard distinct from UK Trade at the component/domain level while reusing repository and shell conventions.
* Future pricing changes should use reference data/domain code, never page markup.

## Decisions still needed

No material unresolved decisions identified.

## Status

🟡 Needs work — active and safely bounded, with minor route-structure debt.

