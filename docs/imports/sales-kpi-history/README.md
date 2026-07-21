# Historical Sales KPI import

This local-only workflow reads `docs/Monthly Compare.xlsx`; it never creates a Supabase client, reads environment variables, or connects to a database.

Canonical workbook sources: `Profit` supplies `monthly_profit`; `Enquiries` supplies the legacy dashboard-compatible `quotes_done`; `SALES INBOX` supplies `sales_inbox_enquiries` and `converted`; the twelve salesperson sheets supply member enquiries, converted counts, and profit. `orders_processed` remains `null`. Conversion-rate and average columns are deliberately not imported because the dashboard derives the rate from enquiries and converted values.

The salesperson sheets lack a year header. `member-aliases.json` explicitly sets `memberYear` to 2024 and holds approved canonical names and aliases. Update it for current membership naming; unresolved names are blocking errors. The current schema has no member/profile UUID field, so imports use only `team_member_key` and `team_member_name` and never create users or memberships.

Run with Node 22's built-in TypeScript stripping (no package installation):

```bash
rtk proxy node --experimental-strip-types scripts/import-sales-kpi-history.ts preview --organisation-id global
rtk proxy node --experimental-strip-types scripts/import-sales-kpi-history.ts validate --organisation-id global
rtk proxy node --experimental-strip-types scripts/import-sales-kpi-history.ts generate --organisation-id global
```

Use a real UUID instead of `global` to create organisation-scoped artifacts. `global` is explicit and matches the existing fixture fallback scope. `generate` writes normalized rows and reports under `generated/`, and emits SQL only when validation has no blocking errors. The default `skip-existing` policy uses `ON CONFLICT DO NOTHING`; it never overwrites a live/manual record. `--conflict-policy update-existing` only updates pre-existing `historical_fixture` rows. Add `--existing path/to/snapshot.json` to classify rows as insert, update, skip, or conflict without connecting to Supabase.
