# Commercial Invoices

**Route:** `/hub/commercial-invoices`

## Purpose

Create and export a commercial-invoice draft.

## Current state

* Loads active Invoice Companies and Product Type defaults through the invoice-directory repository, then renders `CommercialInvoiceGenerator`.
* Validates sender/receiver/line items, applies origin/default rules, previews the draft, and produces browser-generated XLSX or PDF.
* Drafts exist only in memory: there is no invoice persistence, history, or server-side export store. Directory data is Supabase-backed.

## Issues / unfinished work

* Directory data loads before `AppShell` presents its access decision; RLS remains authoritative.
* `invoice_products` exists in schema but is not the generator’s current directory source; schema presence must not drive UI work.
* Export parity needs business-approved verification.

## Decisions already made

* Keep the generator draft-only and browser-exported.
* Use Invoice Companies and Product Types as the active directory/default source; do not reintroduce invoice-product directory use without an approved decision.
* Reuse invoice domain validation/mappers and retain country-of-origin rules outside presentation markup.

## Decisions still needed

Decide whether invoices need durable history/workflow before adding persistence.

## Status

🟡 Needs work — the implemented generator is clear, but persistence scope and export verification remain open.

