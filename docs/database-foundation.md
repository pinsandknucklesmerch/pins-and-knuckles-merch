# Database Foundation

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

## Manual Step

Apply `supabase/migrations/20260709120000_foundation_auth_access.sql` through the Supabase CLI or dashboard SQL editor when ready.
