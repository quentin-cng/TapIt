-- Development-only TapIt location and NFC tag.
-- Run in Supabase SQL Editor after the initial schema migration.
-- Re-running this file reuses the existing location and its first active tag.

insert into public.locations (name, slug)
values ('McGill Fitness Centre', 'mcgill-fitness-centre')
on conflict (slug) do update
set name = excluded.name;

with target_location as (
  select id
  from public.locations
  where slug = 'mcgill-fitness-centre'
),
existing_tag as (
  select tag.token
  from public.nfc_tags as tag
  join target_location as location on location.id = tag.location_id
  where tag.is_active = true
  order by tag.created_at asc
  limit 1
),
inserted_tag as (
  insert into public.nfc_tags (location_id)
  select location.id
  from target_location as location
  where not exists (select 1 from existing_tag)
  returning token
)
select token from existing_tag
union all
select token from inserted_tag
limit 1;
