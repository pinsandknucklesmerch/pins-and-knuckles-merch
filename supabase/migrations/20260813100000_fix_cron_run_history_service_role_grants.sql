-- Forward-only correction: scheduled server handlers write with the service role.
-- Authenticated users remain read-only through the existing developer-only RLS policy.
grant usage on schema public to service_role;
-- startCronRun uses `insert(...).select(...).single()`, so SELECT is required
-- in addition to the write privileges.
grant select, insert, update on table public.cron_run_history to service_role;
