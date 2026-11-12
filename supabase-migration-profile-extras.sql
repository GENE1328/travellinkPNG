-- Subcategories, extra categories, detailed descriptions, promotions and provider insights sign-in.
-- Run after supabase-migration-plans.sql. REVIEW BEFORE RUNNING.
alter table public.business_applications
  add column if not exists detailed_services text,
  add column if not exists subcategories jsonb not null default '[]'::jsonb,
  add column if not exists extra_categories jsonb not null default '[]'::jsonb,
  add column if not exists promotion text;

-- Public view: approved + active subscription, now with the new profile columns appended at the end.
create or replace view public.published_provider_directory as
select id, business_name, category, operating_location, services_offered, description,
       logo_data_url, is_demo, created_at as published_at,
       subscription_status, plan, gallery_data_urls,
       detailed_services, subcategories, extra_categories, promotion
from public.business_applications
where status = 'approved' and subscription_status = 'Active Subscription';

-- Provider insights: a signed-in provider sees only the business whose registered email matches
-- their confirmed account email. Counts are returned for Premium plans only.
-- Keep "Confirm email" switched on in Supabase Auth so nobody can claim another business's email.
create or replace function public.my_provider_insights()
returns table (provider_id uuid, business_name text, plan text, profile_views bigint, calls bigint, emails bigint)
language sql security definer set search_path = public as $$
  select b.id, b.business_name, b.plan,
    case when b.plan = 'Premium' then count(e.id) filter (where e.event = 'profile_view') end,
    case when b.plan = 'Premium' then count(e.id) filter (where e.event = 'call') end,
    case when b.plan = 'Premium' then count(e.id) filter (where e.event = 'email') end
  from public.business_applications b
  left join public.provider_events e on e.provider_id = b.id
  where lower(b.email) = lower(auth.jwt() ->> 'email')
  group by b.id, b.business_name, b.plan;
$$;
revoke all on function public.my_provider_insights() from public, anon;
grant execute on function public.my_provider_insights() to authenticated;
