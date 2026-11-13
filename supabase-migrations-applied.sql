-- Applied to the live "EMDI Travel Connect" project on 2026-11-13 (via the Supabase connection).
-- Kept here for the record. Do not run again.

-- 1. Plan profile columns (the plan itself already existed as subscription_plan)
alter table public.business_applications
  add column if not exists gallery_data_urls jsonb not null default '[]'::jsonb,
  add column if not exists detailed_services text,
  add column if not exists subcategories jsonb not null default '[]'::jsonb,
  add column if not exists extra_categories jsonb not null default '[]'::jsonb,
  add column if not exists promotion text;
-- size checks: gallery max 4 images / 4 MB, detailed services 1000 chars, promotion 120 chars, subcategories 12, extra categories 6
grant insert (gallery_data_urls, detailed_services, subcategories, extra_categories, promotion)
  on public.business_applications to anon, authenticated;

-- 2. Insights events table (anyone can add an event for an existing provider; only administrators can read)
--    provider_events(provider_id -> business_applications.id, event in profile_view | call | email)

-- 3. public.list_public_providers(): approved + Active Subscription + payment verified + inside start/expiry dates.
--    Premium providers sort first. Executable by anon and authenticated.

-- 4. public.my_provider_insights(): a signed-in provider sees counts for the business registered under their
--    confirmed email (owner_email). Counts are returned for Premium plans only.

-- 5. Dropped the public read policy on the old published_provider_directory table, which was filled for every
--    approved provider whether or not the subscription was paid.

-- Already in place before this work and relied on: business_applications_protect_admin_fields (providers cannot change
-- status, plan or subscription fields), business_provider_read_own / update_own, is_emdi_admin(), emdi_admin_allowlist.
