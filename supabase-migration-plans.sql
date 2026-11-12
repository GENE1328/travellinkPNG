-- Plans, photo gallery, public-listing rule and Premium insights.
-- REVIEW BEFORE RUNNING. Written against the columns the website uses on
-- public.business_applications (status, subscription_status, plan, gallery_data_urls).
-- The site keeps working before this runs; plan features switch on afterwards.

alter table public.business_applications
  add column if not exists plan text not null default 'Basic',
  add column if not exists gallery_data_urls jsonb not null default '[]'::jsonb;

alter table public.business_applications drop constraint if exists business_applications_plan_check;
alter table public.business_applications
  add constraint business_applications_plan_check check (plan in ('Basic', 'Professional', 'Premium'));

-- Insights: profile views, call taps and email taps on public provider pages.
create table if not exists public.provider_events (
  id bigint generated always as identity primary key,
  provider_id uuid not null,
  event text not null check (event in ('profile_view', 'call', 'email')),
  created_at timestamptz not null default timezone('utc', now())
);
create index if not exists provider_events_provider_idx on public.provider_events (provider_id, event);
alter table public.provider_events enable row level security;

drop policy if exists provider_events_insert on public.provider_events;
create policy provider_events_insert on public.provider_events
  for insert to anon, authenticated with check (true);

drop policy if exists provider_events_admin_read on public.provider_events;
create policy provider_events_admin_read on public.provider_events
  for select to authenticated using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- Public listing rule: approved AND active subscription only.
-- create or replace keeps existing columns; new columns must be appended at the end.
-- If this errors on column order, run: select pg_get_viewdef('public.published_provider_directory');
-- and add the three new columns (subscription_status, plan, gallery_data_urls) to the end of that definition,
-- plus: and subscription_status = 'Active Subscription'
create or replace view public.published_provider_directory as
select id, business_name, category, operating_location, services_offered, description,
       logo_data_url, is_demo, created_at as published_at,
       subscription_status, plan, gallery_data_urls
from public.business_applications
where status = 'approved' and subscription_status = 'Active Subscription';
