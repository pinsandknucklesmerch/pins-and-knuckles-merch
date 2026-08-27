# Data Management

**Route:** `/hub/data`

## Purpose

Index and operational count summary for maintained reference directories.

## Current state

* Uses `loadDataManagementSummary` to obtain access plus garment, product-type, and invoice-company counts.
* Presents three shared navigation cards to the associated management pages.
* Requires Hub access; the repository supplies access to `AppShell`.

## Issues / unfinished work

* The three destination areas repeat some server-action access resolution/result shaping; their behavioural rules should remain aligned if changed.

## Decisions already made

* Keep this page an index/count surface, not an editable mixed directory.
* Use the shared data-management repository and `MagicBento` navigation cards.
* Retain Garments, Product Types, and Invoice Companies as the only exposed management destinations; no Invoice Products route is active.

## Decisions still needed

No material unresolved decisions identified.

## Status

✅ Good / stable — compact index with live counts and clear destination boundaries.

