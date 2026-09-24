-- TapIt MVP database schema
-- Run this migration once in the Supabase SQL Editor.

create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;

-- Public user data. The primary key is also the Supabase Auth user ID.
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique,
  total_points integer not null default 0 check (total_points >= 0),
  created_at timestamptz not null default now(),
  constraint profiles_username_format check (
    username = lower(username)
    and username ~ '^[a-z0-9_]{3,30}$'
  )
);

create index profiles_leaderboard_idx
  on public.profiles (total_points desc, created_at asc);

-- Gyms and sports clubs where TapIt tags are installed.
create table public.locations (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 1 and 100),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  created_at timestamptz not null default now()
);

-- Tokens are 256-bit random values intended for /checkin/<token> URLs.
-- is_active lets an operator disable a lost or compromised physical tag.
create table public.nfc_tags (
  id uuid primary key default gen_random_uuid(),
  location_id uuid not null references public.locations (id) on delete restrict,
  token text not null unique default encode(extensions.gen_random_bytes(32), 'hex'),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint nfc_tags_token_format check (token ~ '^[0-9a-f]{64}$'),
  unique (id, location_id)
);

create index nfc_tags_location_idx on public.nfc_tags (location_id);

-- Only perform_checkin() may create rows here. Keeping location_id on the row
-- makes profile history and location aggregates straightforward. The composite
-- foreign key guarantees that the tag actually belongs to that location.
create table public.checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  location_id uuid not null,
  nfc_tag_id uuid not null,
  points_awarded integer not null check (points_awarded > 0),
  created_at timestamptz not null default now(),
  constraint checkins_tag_location_fkey
    foreign key (nfc_tag_id, location_id)
    references public.nfc_tags (id, location_id)
    on delete restrict
);

create index checkins_user_recent_idx
  on public.checkins (user_id, created_at desc);
create index checkins_location_recent_idx
  on public.checkins (location_id, created_at desc);

-- MVP friendship: one accepted, undirected relationship stored once. Either
-- participant may add or remove it; there is intentionally no request state.
create table public.friendships (
  user_id uuid not null references public.profiles (id) on delete cascade,
  friend_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, friend_id),
  constraint friendships_distinct_users check (user_id < friend_id)
);

create index friendships_friend_id_idx on public.friendships (friend_id);

-- Create one profile for every Auth user. A valid username supplied as signup
-- metadata is used; otherwise a unique temporary username is generated.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested_username text;
begin
  requested_username := lower(btrim(coalesce(new.raw_user_meta_data ->> 'username', '')));

  if requested_username !~ '^[a-z0-9_]{3,30}$' then
    requested_username := 'user_' || left(replace(new.id::text, '-', ''), 12);
  end if;

  insert into public.profiles (id, username)
  values (new.id, requested_username);

  return new;
end;
$$;

revoke all on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Atomically validate a tag, enforce the global per-user four-hour cooldown,
-- create a rewarded check-in, and increment the user's points.
create or replace function public.perform_checkin(p_token text)
returns table (
  status text,
  checkin_id uuid,
  location_id uuid,
  location_name text,
  points_awarded integer,
  total_points integer,
  checked_in_at timestamptz,
  next_eligible_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  matched_tag_id uuid;
  matched_location_id uuid;
  matched_location_name text;
  latest_checkin_at timestamptz;
  current_total_points integer;
  new_checkin_id uuid;
  checkin_time timestamptz;
begin
  if current_user_id is null then
    raise exception using
      errcode = '42501',
      message = 'Authentication is required to check in.';
  end if;

  select tag.id, tag.location_id, location.name
  into matched_tag_id, matched_location_id, matched_location_name
  from public.nfc_tags as tag
  join public.locations as location on location.id = tag.location_id
  where tag.token = p_token
    and tag.is_active = true;

  if not found then
    return query
    select
      'invalid_tag'::text,
      null::uuid,
      null::uuid,
      null::text,
      0,
      null::integer,
      null::timestamptz,
      null::timestamptz;
    return;
  end if;

  -- Locking the user's profile serializes simultaneous check-in attempts for
  -- that user. The second request waits, then sees the first request's row.
  select profile.total_points
  into current_total_points
  from public.profiles as profile
  where profile.id = current_user_id
  for update;

  if not found then
    raise exception using
      errcode = 'P0001',
      message = 'Profile not found for authenticated user.';
  end if;

  checkin_time := clock_timestamp();

  select checkin.created_at
  into latest_checkin_at
  from public.checkins as checkin
  where checkin.user_id = current_user_id
    and checkin.points_awarded > 0
  order by checkin.created_at desc
  limit 1;

  if latest_checkin_at is not null
     and latest_checkin_at + interval '4 hours' > checkin_time then
    return query
    select
      'cooldown'::text,
      null::uuid,
      matched_location_id,
      matched_location_name,
      0,
      current_total_points,
      null::timestamptz,
      latest_checkin_at + interval '4 hours';
    return;
  end if;

  insert into public.checkins (
    user_id,
    location_id,
    nfc_tag_id,
    points_awarded,
    created_at
  )
  values (
    current_user_id,
    matched_location_id,
    matched_tag_id,
    10,
    checkin_time
  )
  returning id into new_checkin_id;

  update public.profiles
  set total_points = profiles.total_points + 10
  where id = current_user_id
  returning profiles.total_points into current_total_points;

  return query
  select
    'success'::text,
    new_checkin_id,
    matched_location_id,
    matched_location_name,
    10,
    current_total_points,
    checkin_time,
    checkin_time + interval '4 hours';
end;
$$;

revoke all on function public.perform_checkin(text) from public, anon;
grant execute on function public.perform_checkin(text) to authenticated;

-- RLS is enabled on every table exposed through the public Data API.
alter table public.profiles enable row level security;
alter table public.locations enable row level security;
alter table public.nfc_tags enable row level security;
alter table public.checkins enable row level security;
alter table public.friendships enable row level security;

-- Remove Supabase's broad defaults and grant only the operations the app uses.
revoke all on table public.profiles from anon, authenticated;
revoke all on table public.locations from anon, authenticated;
revoke all on table public.nfc_tags from anon, authenticated;
revoke all on table public.checkins from anon, authenticated;
revoke all on table public.friendships from anon, authenticated;

grant select on table public.profiles to authenticated;
grant update (username) on table public.profiles to authenticated;
grant select on table public.locations to authenticated;
grant select on table public.checkins to authenticated;
grant select, insert, delete on table public.friendships to authenticated;

create policy "Authenticated users can view public profiles"
  on public.profiles
  for select
  to authenticated
  using (true);

create policy "Users can update their own username"
  on public.profiles
  for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

create policy "Authenticated users can view locations"
  on public.locations
  for select
  to authenticated
  using (true);

create policy "Users can view their own check-ins"
  on public.checkins
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can view their own friendships"
  on public.friendships
  for select
  to authenticated
  using ((select auth.uid()) in (user_id, friend_id));

create policy "Users can create their own friendships"
  on public.friendships
  for insert
  to authenticated
  with check ((select auth.uid()) in (user_id, friend_id));

create policy "Users can remove their own friendships"
  on public.friendships
  for delete
  to authenticated
  using ((select auth.uid()) in (user_id, friend_id));

comment on function public.perform_checkin(text) is
  'Atomically awards 10 points when the authenticated user is outside the four-hour cooldown.';
