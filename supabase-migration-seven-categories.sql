-- Adds the three new service categories to the provider category list.
-- REVIEW BEFORE RUNNING: adjust the table/column names if your live schema differs.
-- The website adapter writes to public.business_applications.category.
do $$
declare c record; t text;
begin
  select udt_name into t from information_schema.columns
   where table_schema='public' and table_name='business_applications' and column_name='category';
  if t is null then raise notice 'business_applications.category not found; nothing changed'; return; end if;
  if exists (select 1 from pg_type where typname = t and typtype = 'e') then
    execute format('alter type public.%I add value if not exists %L', t, 'Flight Booking & Ticketing Assistance');
    execute format('alter type public.%I add value if not exists %L', t, 'Airport Transfers & Transport');
    execute format('alter type public.%I add value if not exists %L', t, 'Tourism & Tours');
  else
    for c in select conname from pg_constraint
             where conrelid='public.business_applications'::regclass and contype='c'
               and pg_get_constraintdef(oid) ilike '%category%' loop
      execute format('alter table public.business_applications drop constraint %I', c.conname);
    end loop;
    alter table public.business_applications add constraint business_applications_category_check
      check (category in ('Passport Agent','Visa Consultant','Travel Agency','Hotel / Guesthouse',
        'Flight Booking & Ticketing Assistance','Airport Transfers & Transport','Tourism & Tours'));
  end if;
end $$;
-- The published_provider_directory view needs no change if it selects category directly.
