-- Purpose-specific reads and secure self-service account deletion.
-- Run once after 20260923050000_location_geofencing.sql.

begin;

-- The application no longer needs table-wide reads. SECURITY DEFINER RPCs
-- below return only the fields required for each product surface.
revoke select on table public.profiles from authenticated;
revoke select on table public.locations from authenticated;

create function public.get_my_profile()
returns table (
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
  select profile.username, profile.total_points, profile.created_at
  from public.profiles as profile
  where profile.id = v_current_user_id;
end;
$$;

create function public.get_my_checkin_locations()
returns table (
  location_id uuid,
  location_name text
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
      message = 'Authentication is required to view check-in locations.';
  end if;

  return query
  select distinct location.id, location.name
  from public.checkins as checkin
  join public.locations as location on location.id = checkin.location_id
  where checkin.user_id = v_current_user_id;
end;
$$;

create function public.get_global_leaderboard(p_limit integer default 100)
returns table (
  rank_position integer,
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
    profile.username,
    profile.total_points,
    profile.id = v_current_user_id
  from public.profiles as profile
  order by profile.total_points desc, profile.created_at asc,
    profile.username asc, profile.id asc
  limit v_limit;
end;
$$;

create function public.get_relationship_profiles()
returns table (
  profile_id uuid,
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
  select profile.id, profile.username, profile.total_points, profile.created_at
  from related_users
  join public.profiles as profile on profile.id = related_users.related_user_id
  order by profile.total_points desc, profile.created_at asc,
    profile.username asc, profile.id asc;
end;
$$;

create function public.search_profiles(
  p_query text,
  p_limit integer default 10
)
returns table (
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

create function public.send_friend_request_by_username(p_username text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_current_user_id uuid := auth.uid();
  v_username text := lower(btrim(coalesce(p_username, '')));
  v_recipient_id uuid;
begin
  if v_current_user_id is null then
    raise exception using
      errcode = '42501',
      message = 'Authentication is required to send a friend request.';
  end if;

  if v_username !~ '^[a-z0-9_]{3,30}$' then
    return 'not_found';
  end if;

  select profile.id
  into v_recipient_id
  from public.profiles as profile
  where profile.username = v_username;

  if v_recipient_id is null then
    return 'not_found';
  end if;

  return public.send_friend_request(v_recipient_id);
end;
$$;

-- No user identifier is accepted from the caller. Deleting auth.users is the
-- root operation; every user-owned public row is removed by existing CASCADE
-- foreign keys in the same transaction. Venue and NFC infrastructure is not
-- linked to auth.users and remains intact.
create function public.delete_current_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_current_user_id uuid := auth.uid();
begin
  if v_current_user_id is null then
    raise exception using
      errcode = '42501',
      message = 'Authentication is required to delete an account.';
  end if;

  delete from auth.users as auth_user
  where auth_user.id = v_current_user_id;

  if not found then
    raise exception using
      errcode = 'P0002',
      message = 'The authenticated account no longer exists.';
  end if;
end;
$$;

revoke all on function public.get_my_profile() from public, anon, authenticated;
revoke all on function public.get_my_checkin_locations() from public, anon, authenticated;
revoke all on function public.get_global_leaderboard(integer) from public, anon, authenticated;
revoke all on function public.get_relationship_profiles() from public, anon, authenticated;
revoke all on function public.search_profiles(text, integer) from public, anon, authenticated;
revoke all on function public.send_friend_request_by_username(text) from public, anon, authenticated;
revoke all on function public.delete_current_account() from public, anon, authenticated;

grant execute on function public.get_my_profile() to authenticated;
grant execute on function public.get_my_checkin_locations() to authenticated;
grant execute on function public.get_global_leaderboard(integer) to authenticated;
grant execute on function public.get_relationship_profiles() to authenticated;
grant execute on function public.search_profiles(text, integer) to authenticated;
grant execute on function public.send_friend_request_by_username(text) to authenticated;
grant execute on function public.delete_current_account() to authenticated;

comment on function public.delete_current_account() is
  'Deletes only auth.uid(); existing foreign-key cascades remove all user-owned application rows atomically.';

commit;
