# Database Foundation

> Historical foundation note: this document preserves the original schema and
> access-model decisions. The migration instructions below are not a current
> “apply when ready” task list. The foundation migration is part of the active
> forward-only migration chain; consult [`PROJECT_CONTEXT.md`](ai-context/PROJECT_CONTEXT.md)
> for current schema status.

## Tables

`profiles` stores one application profile per Supabase Auth user.

`organisations` stores shared business accounts used by Pins Hub and MerchBuddy.

`organisation_members` links profiles to organisations with one role per organisation.

`app_access` grants each organisation member access to `pins_hub` or `merchbuddy`.

## Access Model

All foundation tables have RLS enabled.

Users can read and update their own profile, read organisations they belong to, read membership rows for organisations they belong to, and read app access rows attached to their own memberships.

## Auth Trigger

`public.handle_new_user()` creates a `profiles` row whenever Supabase Auth creates an `auth.users` row.

## Historical Manual Step

The original plan said to apply `supabase/migrations/20260709120000_foundation_auth_access.sql`
through the Supabase CLI or dashboard SQL editor when ready. Preserve this as
historical context; do not interpret it as a pending instruction without checking
the current migration history and project context.
