-- Separate human-readable display names from unique usernames while preserving
-- the existing privacy-hardened profile access model. Run once after
-- 20260924000000_general_leaderboard_privacy.sql.

begin;

alter table public.profiles
  add column display_name text;

update public.profiles
set display_name = username;

alter table public.profiles
  alter column display_name set not null,
  add constraint profiles_display_name_format check (
    char_length(display_name) between 1 and 30
    and display_name = btrim(display_name)
    and display_name !~ '[[:cntrl:]]'
    and display_name !~ '^[[:space:]]|[[:space:]]$'
  );

comment on column public.profiles.display_name is
  'Non-unique, human-readable profile name. Usernames remain the unique social identifier.';

-- Signup metadata is validated again inside the database. Older clients and
-- malformed metadata safely fall back to the validated username.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested_username text;
  requested_display_name text;
begin
  requested_username := lower(btrim(coalesce(new.raw_user_meta_data ->> 'username', '')));

  if requested_username !~ '^[a-z0-9_]{3,30}$' then
    requested_username := 'user_' || left(replace(new.id::text, '-', ''), 12);
  end if;

  requested_display_name := btrim(
    coalesce(new.raw_user_meta_data ->> 'display_name', '')
  );

  if char_length(requested_display_name) not between 1 and 30
     or requested_display_name ~ '[[:cntrl:]]'
     or requested_display_name ~ '^[[:space:]]|[[:space:]]$' then
    requested_display_name := requested_username;
  end if;

  insert into public.profiles (id, username, display_name)
  values (new.id, requested_username, requested_display_name);

  return new;
end;
$$;

-- The app updates identity only through this authenticated boundary. Existing
-- direct username writes are closed without weakening profile RLS.
revoke update (username) on table public.profiles from authenticated;

create function public.update_my_profile(
  p_display_name text,
  p_username text
)
returns table (
  display_name text,
  username text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_current_user_id uuid := auth.uid();
  v_display_name text := btrim(coalesce(p_display_name, ''));
  v_username text := lower(btrim(coalesce(p_username, '')));
begin
  if v_current_user_id is null then
    raise exception using
      errcode = '42501',
      message = 'Authentication is required to update a profile.';
  end if;

  if char_length(v_display_name) not between 1 and 30
     or v_display_name ~ '[[:cntrl:]]'
     or v_display_name ~ '^[[:space:]]|[[:space:]]$' then
    raise exception using
      errcode = '22023',
      message = 'Display name must be 1 to 30 trimmed characters.';
  end if;

  if v_username !~ '^[a-z0-9_]{3,30}$' then
    raise exception using
      errcode = '22023',
      message = 'Username format is invalid.';
  end if;

  return query
  update public.profiles as profile
  set
    display_name = v_display_name,
    username = v_username
  where profile.id = v_current_user_id
  returning profile.display_name, profile.username;

  if not found then
    raise exception using
      errcode = 'P0002',
      message = 'The authenticated profile does not exist.';
  end if;
end;
$$;

drop function public.get_my_profile();

create function public.get_my_profile()
returns table (
  display_name text,
  username text,
  total_points integer,
  created_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_current_user_id uuid := auth.uid();
begin
  if v_current_user_id is null then
    raise exception using
      errcode = '42501',
      message = 'Authentication is required to view a profile.';
  end if;

  return query
  select
    profile.display_name,
    profile.username,
    profile.total_points,
    profile.created_at
  from public.profiles as profile
  where profile.id = v_current_user_id;
end;
$$;

drop function public.get_relationship_profiles();

create function public.get_relationship_profiles()
returns table (
  profile_id uuid,
  display_name text,
  username text,
  total_points integer,
  created_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_current_user_id uuid := auth.uid();
begin
  if v_current_user_id is null then
    raise exception using
      errcode = '42501',
      message = 'Authentication is required to view relationship profiles.';
  end if;

  return query
  with related_users as (
    select case
      when friendship.user_id = v_current_user_id then friendship.friend_id
      else friendship.user_id
    end as related_user_id
    from public.friendships as friendship
    where v_current_user_id in (friendship.user_id, friendship.friend_id)

    union

    select case
      when request.requester_id = v_current_user_id then request.recipient_id
      else request.requester_id
    end
    from public.friend_requests as request
    where v_current_user_id in (request.requester_id, request.recipient_id)
  )
  select
    profile.id,
    profile.display_name,
    profile.username,
    profile.total_points,
    profile.created_at
  from related_users
  join public.profiles as profile on profile.id = related_users.related_user_id
  order by profile.total_points desc, profile.created_at asc,
    profile.username asc, profile.id asc;
end;
$$;

drop function public.search_profiles(text, integer);

create function public.search_profiles(
  p_query text,
  p_limit integer default 10
)
returns table (
  display_name text,
  username text,
  total_points integer,
  relationship_status text,
  request_id uuid
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_current_user_id uuid := auth.uid();
  v_query text := lower(btrim(coalesce(p_query, '')));
  v_limit integer := least(greatest(coalesce(p_limit, 10), 1), 10);
begin
  if v_current_user_id is null then
    raise exception using
      errcode = '42501',
      message = 'Authentication is required to search profiles.';
  end if;

  if v_query !~ '^[a-z0-9_]{1,30}$' then
    return;
  end if;

  return query
  select
    profile.display_name,
    profile.username,
    profile.total_points,
    case
      when friendship.user_id is not null then 'friends'::text
      when request.requester_id = v_current_user_id then 'outgoing'::text
      when request.recipient_id = v_current_user_id then 'incoming'::text
      else 'none'::text
    end,
    request.id
  from public.profiles as profile
  left join public.friendships as friendship
    on friendship.user_id = least(v_current_user_id, profile.id)
    and friendship.friend_id = greatest(v_current_user_id, profile.id)
  left join public.friend_requests as request
    on least(request.requester_id, request.recipient_id)
      = least(v_current_user_id, profile.id)
    and greatest(request.requester_id, request.recipient_id)
      = greatest(v_current_user_id, profile.id)
  where profile.id <> v_current_user_id
    and profile.username like v_query || '%'
  order by profile.username asc, profile.id asc
  limit v_limit;
end;
$$;

drop function public.get_global_leaderboard(integer);

create function public.get_global_leaderboard(p_limit integer default 100)
returns table (
  rank_position integer,
  display_name text,
  username text,
  total_points integer,
  is_current_user boolean
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_current_user_id uuid := auth.uid();
  v_limit integer := least(greatest(coalesce(p_limit, 100), 1), 100);
begin
  if v_current_user_id is null then
    raise exception using
      errcode = '42501',
      message = 'Authentication is required to view the leaderboard.';
  end if;

  return query
  select
    row_number() over (
      order by profile.total_points desc, profile.created_at asc,
        profile.username asc, profile.id asc
    )::integer,
    case
      when profile.show_username_on_general_leaderboard then profile.display_name
      else 'Anonymous'::text
    end,
    case
      when profile.show_username_on_general_leaderboard then profile.username
      else null::text
    end,
    profile.total_points,
    profile.id = v_current_user_id
  from public.profiles as profile
  order by profile.total_points desc, profile.created_at asc,
    profile.username asc, profile.id asc
  limit v_limit;
end;
$$;

-- Preserve the existing weekly calculations exactly and add display names in a
-- narrow wrapper. The base function remains inaccessible to API roles.
alter function public.get_social_weekly_stats()
  rename to get_social_weekly_stats_base;

revoke all on function public.get_social_weekly_stats_base()
  from public, anon, authenticated;

create function public.get_social_weekly_stats()
returns table (
  participant_user_id uuid,
  display_name text,
  username text,
  total_points integer,
  current_week_start date,
  current_weekly_goal integer,
  current_weekly_sessions integer,
  current_week_goal_achieved boolean,
  previous_week_start date,
  previous_weekly_goal integer,
  previous_weekly_sessions integer,
  previous_week_goal_achieved boolean,
  previous_week_points integer,
  current_weekly_goal_streak integer,
  best_weekly_goal_streak integer
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_current_user_id uuid := auth.uid();
begin
  if v_current_user_id is null then
    raise exception using
      errcode = '42501',
      message = 'Authentication is required to view social weekly statistics.';
  end if;

  return query
  select
    base.participant_user_id,
    profile.display_name,
    base.username,
    base.total_points,
    base.current_week_start,
    base.current_weekly_goal,
    base.current_weekly_sessions,
    base.current_week_goal_achieved,
    base.previous_week_start,
    base.previous_weekly_goal,
    base.previous_weekly_sessions,
    base.previous_week_goal_achieved,
    base.previous_week_points,
    base.current_weekly_goal_streak,
    base.best_weekly_goal_streak
  from public.get_social_weekly_stats_base() as base
  join public.profiles as profile
    on profile.id = base.participant_user_id
  order by base.username, base.participant_user_id;
end;
$$;

revoke all on function public.handle_new_user()
  from public, anon, authenticated;
revoke all on function public.update_my_profile(text, text)
  from public, anon, authenticated;
revoke all on function public.get_my_profile()
  from public, anon, authenticated;
revoke all on function public.get_relationship_profiles()
  from public, anon, authenticated;
revoke all on function public.search_profiles(text, integer)
  from public, anon, authenticated;
revoke all on function public.get_global_leaderboard(integer)
  from public, anon, authenticated;
revoke all on function public.get_social_weekly_stats()
  from public, anon, authenticated;

grant execute on function public.update_my_profile(text, text)
  to authenticated;
grant execute on function public.get_my_profile()
  to authenticated;
grant execute on function public.get_relationship_profiles()
  to authenticated;
grant execute on function public.search_profiles(text, integer)
  to authenticated;
grant execute on function public.get_global_leaderboard(integer)
  to authenticated;
grant execute on function public.get_social_weekly_stats()
  to authenticated;

comment on function public.update_my_profile(text, text) is
  'Validates and updates only auth.uid() display name and unique username.';
comment on function public.get_global_leaderboard(integer) is
  'Ranks every profile, returning no real identity fields for opted-out users.';
comment on function public.get_social_weekly_stats() is
  'Returns limited weekly statistics and identity only for auth.uid() and accepted friends.';

commit;
