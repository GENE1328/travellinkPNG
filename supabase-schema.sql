-- EMDI Travel & Passport Connect registration schema
-- Run in the Supabase SQL editor before using supabase-adapter.js.
-- Never expose a service_role key in browser code.

create extension if not exists pgcrypto;

do $$ begin
  create type public.registration_status as enum ('Pending', 'Approved', 'Rejected', 'Suspended');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.provider_subscription_status as enum ('Free Trial', 'Active Subscription', 'Expired Subscription');
exception when duplicate_object then null;
end $$;

create table if not exists public.citizen_registrations (
  id uuid primary key default gen_random_uuid(),
  full_name text not null check (char_length(trim(full_name)) between 2 and 160),
  email text not null check (char_length(email) <= 254),
  mobile_number text not null check (char_length(trim(mobile_number)) between 3 and 40),
  province text not null check (char_length(trim(province)) between 2 and 120),
  service_interest text not null check (service_interest in ('Passport assistance', 'Visa assistance', 'Travel arrangements', 'Accommodation', 'All services')),
  status public.registration_status not null default 'Pending',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.provider_applications (
  id uuid primary key default gen_random_uuid(),
  business_name text not null check (char_length(trim(business_name)) between 2 and 180),
  category text not null check (category in ('Passport Agents', 'Visa Consultants', 'Travel Agencies', 'Accommodation Providers')),
  contact_name text not null check (char_length(trim(contact_name)) between 2 and 160),
  phone text not null check (char_length(trim(phone)) between 3 and 40),
  email text not null check (char_length(email) <= 254),
  location text not null check (char_length(trim(location)) between 2 and 180),
  services_offered text not null check (char_length(trim(services_offered)) between 2 and 1000),
  description text not null check (char_length(trim(description)) between 2 and 1000),
  logo_url text,
  status public.registration_status not null default 'Pending',
  subscription_status public.provider_subscription_status not null default 'Free Trial',
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists citizen_registrations_status_created_idx
  on public.citizen_registrations (status, created_at desc);
create index if not exists provider_applications_status_created_idx
  on public.provider_applications (status, created_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

drop trigger if exists citizen_registrations_set_updated_at on public.citizen_registrations;
create trigger citizen_registrations_set_updated_at
before update on public.citizen_registrations
for each row execute function public.set_updated_at();

drop trigger if exists provider_applications_set_updated_at on public.provider_applications;
create trigger provider_applications_set_updated_at
before update on public.provider_applications
for each row execute function public.set_updated_at();

alter table public.citizen_registrations enable row level security;
alter table public.provider_applications enable row level security;

-- Public visitors may submit registrations, but cannot read or modify them.
drop policy if exists citizen_public_insert on public.citizen_registrations;
create policy citizen_public_insert
on public.citizen_registrations for insert
to anon, authenticated
with check (status = 'Pending');

drop policy if exists provider_public_insert on public.provider_applications;
create policy provider_public_insert
on public.provider_applications for insert
to anon, authenticated
with check (status = 'Pending' and subscription_status = 'Free Trial');

-- Admin users must be created in Supabase Auth with app_metadata.role = 'admin'.
-- app_metadata is server-controlled; do not use user_metadata for authorization.
drop policy if exists citizen_admin_select on public.citizen_registrations;
create policy citizen_admin_select
on public.citizen_registrations for select
to authenticated
using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

drop policy if exists citizen_admin_update on public.citizen_registrations;
create policy citizen_admin_update
on public.citizen_registrations for update
to authenticated
using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
with check (true);

drop policy if exists provider_admin_select on public.provider_applications;
create policy provider_admin_select
on public.provider_applications for select
to authenticated
using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

drop policy if exists provider_admin_update on public.provider_applications;
create policy provider_admin_update
on public.provider_applications for update
to authenticated
using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin')
with check ((status <> 'Approved') or true);

-- Public directory access is intentionally limited to approved providers and safe profile fields.
-- Prefer a view rather than exposing all contact details to anonymous users.
create or replace view public.approved_provider_directory
as
select id, business_name, category, location, services_offered, description, logo_url, created_at
from public.provider_applications
where status = 'Approved';

grant select on public.approved_provider_directory to anon, authenticated;

-- Do not grant anonymous SELECT on provider_applications itself: it contains contact details.
-- Anonymous directory reads use approved_provider_directory only.
