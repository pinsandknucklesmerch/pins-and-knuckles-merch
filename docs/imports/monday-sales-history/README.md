# Monday Sales History Discovery

This directory contains only read-only Monday.com discovery output and mapping review material. It never contains a token, Supabase SQL, or production import data.

Run from the repository root with a server-only `MONDAY_API_TOKEN` set in your shell:

```bash
node --experimental-strip-types scripts/audit-monday-sales-history.ts boards
node --experimental-strip-types scripts/audit-monday-sales-history.ts inspect --board-id <id>
node --experimental-strip-types scripts/audit-monday-sales-history.ts sample --board-id <id> --limit 20
node --experimental-strip-types scripts/audit-monday-sales-history.ts coverage --board-id <id>
node --experimental-strip-types scripts/audit-monday-sales-history.ts report --board-id <id> --limit 2000
node --experimental-strip-types scripts/audit-monday-sales-history.ts summarize --board-id 18420001220
```

`coverage` uses item creation time until a reviewed `--date-column-id` is supplied. The report command overwrites the local JSON artifacts with the reviewed board data. Historical totals must not be calculated from these results until `monday-kpi-mapping.example.json` has been completed and status/date-history risks have been resolved.

Profit is deliberately out of scope: its authoritative future source is EPCC report emails in the dedicated Gmail account. This audit neither connects to Gmail nor to Supabase.

`summarize` fetches every accessible top-level item in a monthly board (in pages of 100), includes only `WEEK 1` through `WEEK 4`, and writes review artifacts to `generated/<board-id>/`. It reports both all-lead and Sales-Inbox-only scopes, plus board-membership and valid-`Date In Touch`-month totals. It does not claim deleted, inaccessible, or subitems as available data.
