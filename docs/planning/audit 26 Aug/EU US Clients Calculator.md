# EU US Clients Calculator

**Route:** `/hub/calculators/eu/us-clients`

## Purpose

Build EU US Clients quotes using the EU calculator engine and its own profile.

## Current state

* Loads `EU_US_CLIENTS` reference data and reuses `EuCalculator` with its profile code.
* Shares the EU calculator’s client-local draft, repository loading, domain calculation, validation, breakdown, and error-state pattern.
* Requires ordinary Hub access via `AppShell`.

## Issues / unfinished work

* It duplicates the Standard route’s orchestration/error structure and uses compressed one-line route markup, increasing review drift risk.
* Like the Standard route, it loads data before shell access rendering.

## Decisions already made

* Keep EU US Clients as a profile variation of the shared EU engine, rather than a forked calculator implementation.
* Preserve EU input normalisation and the separation of optional delivery from calculator totals.

## Decisions still needed

No material unresolved decisions identified.

## Status

🟡 Needs work — functionality is shared correctly, but route-level duplication/readability should not spread.

