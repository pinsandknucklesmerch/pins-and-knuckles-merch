# Database Backup and Restore

This is a repository-verified reference for the database scripts. It supports
database backups and restoration of application data to a safe local,
non-production Supabase/Postgres target for realistic testing. It is not a
complete Supabase-platform disaster-recovery procedure.

## Commands and prerequisites

```bash
npm run db:test
npm run db:backup
npm run db:restore -- backups/database/<file>.dump
```

- `db:test` validates `DIRECT_DATABASE_URL` and runs `SELECT 1`; it requires
  `python3`, `psql`, and a reachable database.
- `db:backup` requires `pg_dump`.
- `db:restore` requires `pg_restore`, `psql`, `python3`, and an interactive
  terminal for confirmation.

Variables are loaded from the environment or `.env.local`; see
[`.env.example`](../../.env.example). Do not place connection strings in
documentation or commit them.

| Variable | Purpose |
| --- | --- |
| `DIRECT_DATABASE_URL` | Direct source connection used for the connectivity check and backup. The restore script also uses it to reject an identical target. |
| `RESTORE_DATABASE_URL` | Required disposable/local/non-production restore target. |
| `RESTORE_ADMIN_DATABASE_URL` | Optional local privileged connection for `auth.users` ownership work; required when the normal restore connection cannot perform that operation. It must point to the same host, database, and port as the restore target. |

## Backup behavior

`scripts/backup-database.sh` runs `pg_dump --format=custom` against
`DIRECT_DATABASE_URL`. It uses the default `pg_dump` scope: the dump contains
database objects and data accessible through that connection; the script does
not select individual schemas or tables and declares no exclusions.

Backups are written atomically through a temporary partial file to:

```text
backups/database/pins-hub-YYYY-MM-DD_HH-MM-SS.dump
```

The script creates the directory, reports the completed path and file size, and
removes its partial output when interrupted or failed. A successful backup
requires a working connection and `pg_dump`; the script does not independently
validate recoverability. Because restore explicitly loads `auth.users` from the
dump, required Auth user rows are expected to be present when the source
connection has included them.

## Restore safety and destructive scope

Restore is destructive to the selected target. After preflight succeeds, it
removes existing non-extension objects in the target `public` schema before
loading the backup's filtered public objects/data.

Before this occurs, the script requires:

- exactly one existing, readable dump file with a valid `pg_restore --list`;
- a valid PostgreSQL `RESTORE_DATABASE_URL` with host, port, and database;
- a target different from `DIRECT_DATABASE_URL` when the latter is set;
- a target hostname that is not `supabase.co`, `*.supabase.co`, or
  `*.pooler.supabase.com`;
- an ownership diagnostic for `auth.users`;
- typed interactive confirmation: `RESTORE`.

It rejects non-interactive execution. If configured,
`RESTORE_ADMIN_DATABASE_URL` is validated as a PostgreSQL URI, rejected when it
matches the source or resembles a production Supabase endpoint, and required to
address exactly the same target host/database/port.

The script also classifies common connection failures without printing the full
connection URI. These checks reduce risk; operators must still ensure the target
is disposable and correct.

## Public-schema restore

The script builds a restore table-of-contents containing `public` entries and
then restores it with `pg_restore --no-owner --use-list`. Before restore it drops
non-extension public functions, relations, views, materialized views, and
sequences; dependent policies, triggers, indexes, constraints, and owned
sequences are removed through `CASCADE` and recreated from the dump.

The public schema itself is not dropped. The generated restore list excludes:

- default ACL entries;
- public schema ACL entries; and
- public schema ownership/schema entries.

This avoids restoring public-schema/default-ACL noise. Other eligible public
TOC entries, including explicit application table/function grant entries when
present in the dump, remain in the restore list. The script does not use
`pg_restore --clean`.

## Supabase Auth users

`public.profiles.id` references `auth.users.id`, so the restore loads required
`auth.users` data before the public restore completes.

1. The script determines whether `RESTORE_DATABASE_URL` can perform the
   required owner-level `auth.users` operation. If not,
   `RESTORE_ADMIN_DATABASE_URL` must provide that local privilege.
2. It disables user triggers on the local target's `auth.users`, then deletes
   existing users. Dependent local user rows are removed through existing Auth
   foreign keys.
3. It restores data only for `auth.users` using
   `pg_restore --data-only --schema=auth --table=users --no-owner`.
4. It restores filtered public objects/data, re-enables Auth user triggers, and
   recreates `on_auth_user_created` to call `public.handle_new_user()`.

Only `auth.users` data is restored. Sessions, refresh tokens, MFA rows, OAuth
state, and other transient Auth/user-dependent state are intentionally not
restored. The local Auth schema, Auth functions/extensions, Auth instances, and
other managed schemas remain managed by the local Supabase environment.

The script does not document or alter password/authentication semantics beyond
the `auth.users` data it restores.

## What is not restored by this workflow

- Active sessions, refresh tokens, MFA state, OAuth transient state, and other
  non-`auth.users` Auth data.
- Managed Supabase schemas, functions, extensions, and instances outside the
  explicitly restored `auth.users` data and filtered `public` content.
- Supabase Storage objects, external integration credentials/secrets, Vercel
  configuration, and other platform resources not handled by `pg_dump`/
  `pg_restore` in these scripts.

## Safe restore validation

Only restore into a disposable local/test target. After a successful restore:

1. Run `npm run db:test` with `DIRECT_DATABASE_URL` pointed only at the target
   you are validating, or use an equivalent safe local connection check.
2. Query representative target counts for `auth.users`, `profiles`,
   `organisation_members`, `sales_kpi_months`, and `garments`.
3. Compare those counts with source/backup expectations for that backup; do not
   treat any fixed count as a permanent project truth.
4. Confirm `public.handle_new_user()` and the `on_auth_user_created` trigger
   exist after restore, and inspect representative application data through the
   local environment.

A successful restore to a disposable target is the practical recovery test for
this tooling.

## Verification boundary and limitations

Repository review cannot prove source credentials/connectivity, that a specific
dump is usable, production recovery, Storage recovery, external integrations,
or Vercel configuration. It cannot replace an actual restore test. For current
schema/access context see [DATABASE_SCHEMA.md](../reference/DATABASE_SCHEMA.md).
