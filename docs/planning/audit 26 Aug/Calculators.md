# Calculators

**Route:** `/hub/calculators`

## Purpose

Index of implemented regional pricing calculators.

## Current state

* Shows shared `MagicBento` navigation grouped as EU and UK.
* Links to EU Standard, EU US Clients, UK Trade, and UK Standard. No calculation or reference-data loading occurs here.
* Requires ordinary Hub access through the shared layout.

## Issues / unfinished work

No significant current issues identified.

## Decisions already made

* Keep the calculator index as a compact launcher and retain the EU/UK grouping.
* Do not infer an EU Trade route from old planning/reference material; no active EU Trade profile/page is present.
* Continue using `MagicBento` only as navigation, not as a form or calculation surface.

## Decisions still needed

No material unresolved decisions identified.

## Status

✅ Good / stable — a small, shared navigation surface with only active calculators exposed.

