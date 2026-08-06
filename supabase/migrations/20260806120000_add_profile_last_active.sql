-- Pins Hub activity is recorded by authenticated users only; existing profiles remain unbackfilled.
alter table public.profiles
  add column if not exists last_active_at timestamptz null;

comment on column public.profiles.last_active_at is 'Most recent throttled authenticated Pins Hub activity timestamp.';
