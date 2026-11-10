-- Run once for a NEW database. Existing bookings tables need no migration.
create table public.bookings (
  id uuid primary key,
  job_number bigint generated always as identity unique,
  created_at timestamptz not null default now(),
  created_by uuid not null default auth.uid() references auth.users(id),
  customer jsonb not null check (jsonb_typeof(customer) = 'object'),
  repair jsonb not null check (jsonb_typeof(repair) = 'object'),
  courtesy_items jsonb not null check (jsonb_typeof(courtesy_items) = 'array'),
  costs jsonb not null check (jsonb_typeof(costs) = 'object'),
  business jsonb not null check (jsonb_typeof(business) = 'object')
);
alter table public.bookings enable row level security;
revoke all on public.bookings from anon, authenticated;
grant select, insert on public.bookings to authenticated;
grant usage, select on sequence public.bookings_job_number_seq to authenticated;
create policy "Employees can read repair bookings" on public.bookings
for select to authenticated using ((auth.jwt()->'app_metadata'->>'role') = 'employee');
create policy "Employees can create repair bookings" on public.bookings
for insert to authenticated with check (
  (auth.jwt()->'app_metadata'->>'role') = 'employee' and created_by = auth.uid()
);
-- Create an employee in Authentication > Users, then replace the example email:
-- update auth.users set raw_app_meta_data = raw_app_meta_data || '{"role":"employee"}'::jsonb
-- where email = 'employee@example.com';
-- Sign in again after changing metadata.
