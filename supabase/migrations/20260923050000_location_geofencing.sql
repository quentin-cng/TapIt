-- Optional per-location geofencing for NFC check-ins.
-- Run once after 20260923040000_mutual_friend_requests.sql.

begin;

alter table public.locations
  add column latitude double precision,
  add column longitude double precision,
  add column checkin_radius_meters integer,
  add column requires_location_verification boolean not null default false,
  add constraint locations_latitude_range check (
    latitude is null
    or (
      latitude not in (
        'NaN'::double precision,
        'Infinity'::double precision,
        '-Infinity'::double precision
      )
      and latitude between -90 and 90
    )
  ),
  add constraint locations_longitude_range check (
    longitude is null
    or (
      longitude not in (
        'NaN'::double precision,
        'Infinity'::double precision,
        '-Infinity'::double precision
      )
      and longitude between -180 and 180
    )
  ),
  add constraint locations_checkin_radius_range check (
    checkin_radius_meters is null
    or checkin_radius_meters between 25 and 1000
  ),
  add constraint locations_geofence_configuration check (
    (
      latitude is null
      and longitude is null
      and checkin_radius_meters is null
      and requires_location_verification = false
    )
    or (
      latitude is not null
      and longitude is not null
      and checkin_radius_meters is not null
    )
  );

comment on column public.locations.requires_location_verification is
  'When true, perform_checkin requires a sufficiently accurate position inside this location geofence.';

-- Resolve only the minimum context needed before the user presses CHECK IN.
-- Venue coordinates, radius, and tag identifiers are intentionally omitted.
create function public.get_checkin_context(p_token text)
returns table (
  status text,
  location_name text,
  requires_location_verification boolean
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
      message = 'Authentication is required to view check-in context.';
  end if;

  return query
  select
    'valid'::text,
    location.name,
    location.requires_location_verification
  from public.nfc_tags as tag
  join public.locations as location on location.id = tag.location_id
  where tag.token = p_token
    and tag.is_active = true;

  if not found then
    return query
    select 'invalid_tag'::text, null::text, false;
  end if;
end;
$$;

revoke all on function public.get_checkin_context(text) from public, anon;
grant execute on function public.get_checkin_context(text) to authenticated;

-- The old one-argument awarding path must not remain available because it
-- could bypass location verification by calling the Data API directly.
drop function public.perform_checkin(text);

create function public.perform_checkin(
  p_token text,
  p_latitude double precision,
  p_longitude double precision,
  p_accuracy_meters double precision
)
returns table (
  status text,
  checkin_id uuid,
  location_id uuid,
  location_name text,
  points_awarded integer,
  total_points integer,
  checked_in_at timestamptz,
  next_eligible_at timestamptz,
  weekly_goal integer,
  weekly_sessions integer,
  weekly_bonus_points integer,
  weekly_goal_completed boolean,
  total_points_earned integer
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
  matched_latitude double precision;
  matched_longitude double precision;
  matched_radius_meters integer;
  matched_requires_location boolean;
  latest_checkin_at timestamptz;
  current_total_points integer;
  new_checkin_id uuid;
  checkin_time timestamptz;
  current_week date;
  current_week_starts_at timestamptz;
  next_week_starts_at timestamptz;
  current_weekly_goal integer;
  current_weekly_sessions integer := 0;
  awarded_weekly_bonus integer := 0;
  newly_completed_weekly_goal boolean := false;
  points_earned_this_checkin integer := 0;
  haversine_intermediate double precision;
  distance_meters double precision;
  accuracy_allowance_meters double precision;
begin
  if current_user_id is null then
    raise exception using
      errcode = '42501',
      message = 'Authentication is required to check in.';
  end if;

  select
    tag.id,
    tag.location_id,
    location.name,
    location.latitude,
    location.longitude,
    location.checkin_radius_meters,
    location.requires_location_verification
  into
    matched_tag_id,
    matched_location_id,
    matched_location_name,
    matched_latitude,
    matched_longitude,
    matched_radius_meters,
    matched_requires_location
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
      null::timestamptz,
      null::integer,
      null::integer,
      0,
      false,
      0;
    return;
  end if;

  if matched_requires_location then
    if p_latitude is null
       or p_longitude is null
       or p_accuracy_meters is null then
      return query
      select
        'location_required'::text,
        null::uuid,
        matched_location_id,
        matched_location_name,
        0,
        null::integer,
        null::timestamptz,
        null::timestamptz,
        null::integer,
        null::integer,
        0,
        false,
        0;
      return;
    end if;

    if p_latitude in (
         'NaN'::double precision,
         'Infinity'::double precision,
         '-Infinity'::double precision
       )
       or p_longitude in (
         'NaN'::double precision,
         'Infinity'::double precision,
         '-Infinity'::double precision
       )
       or p_accuracy_meters in (
         'NaN'::double precision,
         'Infinity'::double precision,
         '-Infinity'::double precision
       )
       or p_latitude < -90
       or p_latitude > 90
       or p_longitude < -180
       or p_longitude > 180
       or p_accuracy_meters < 0 then
      return query
      select
        'invalid_location'::text,
        null::uuid,
        matched_location_id,
        matched_location_name,
        0,
        null::integer,
        null::timestamptz,
        null::timestamptz,
        null::integer,
        null::integer,
        0,
        false,
        0;
      return;
    end if;

    if p_accuracy_meters > 150 then
      return query
      select
        'location_too_inaccurate'::text,
        null::uuid,
        matched_location_id,
        matched_location_name,
        0,
        null::integer,
        null::timestamptz,
        null::timestamptz,
        null::integer,
        null::integer,
        0,
        false,
        0;
      return;
    end if;

    haversine_intermediate :=
      pg_catalog.power(
        pg_catalog.sin(
          pg_catalog.radians(p_latitude - matched_latitude) / 2
        ),
        2
      )
      + pg_catalog.cos(pg_catalog.radians(matched_latitude))
      * pg_catalog.cos(pg_catalog.radians(p_latitude))
      * pg_catalog.power(
          pg_catalog.sin(
            pg_catalog.radians(p_longitude - matched_longitude) / 2
          ),
          2
        );

    distance_meters := 2 * 6371000
      * pg_catalog.asin(
          pg_catalog.sqrt(
            least(
              1.0,
              greatest(0.0, haversine_intermediate)
            )
          )
        );
    accuracy_allowance_meters := least(p_accuracy_meters, 75.0);

    if distance_meters
       > matched_radius_meters + accuracy_allowance_meters then
      return query
      select
        'outside_geofence'::text,
        null::uuid,
        matched_location_id,
        matched_location_name,
        0,
        null::integer,
        null::timestamptz,
        null::timestamptz,
        null::integer,
        null::integer,
        0,
        false,
        0;
      return;
    end if;
  end if;

  -- Preserve the existing per-user serialization for cooldowns and weekly
  -- completion bonuses after any required geofence validation succeeds.
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

  checkin_time := pg_catalog.clock_timestamp();
  current_week := pg_catalog.date_trunc(
    'week',
    pg_catalog.timezone('America/Montreal', checkin_time)
  )::date;
  current_week_starts_at := current_week::timestamp
    at time zone 'America/Montreal';
  next_week_starts_at := (current_week + 7)::timestamp
    at time zone 'America/Montreal';

  select schedule.goal_sessions
  into current_weekly_goal
  from public.weekly_goal_schedules as schedule
  where schedule.user_id = current_user_id
    and schedule.effective_week <= current_week
  order by schedule.effective_week desc
  limit 1;

  if not found then
    raise exception using
      errcode = 'P0001',
      message = 'A weekly goal must be configured before checking in.';
  end if;

  select count(*)::integer
  into current_weekly_sessions
  from public.checkins as checkin
  where checkin.user_id = current_user_id
    and checkin.points_awarded > 0
    and checkin.created_at >= current_week_starts_at
    and checkin.created_at < next_week_starts_at;

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
      latest_checkin_at + interval '4 hours',
      current_weekly_goal,
      current_weekly_sessions,
      0,
      false,
      0;
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

  current_weekly_sessions := current_weekly_sessions + 1;

  if current_weekly_sessions >= current_weekly_goal then
    insert into public.weekly_goal_completions (
      user_id,
      week_start,
      goal_sessions,
      sessions_at_completion,
      bonus_points,
      completed_at
    )
    values (
      current_user_id,
      current_week,
      current_weekly_goal,
      current_weekly_sessions,
      current_weekly_goal * 5,
      checkin_time
    )
    on conflict on constraint weekly_goal_completions_pkey do nothing
    returning bonus_points into awarded_weekly_bonus;

    newly_completed_weekly_goal := found;

    if not newly_completed_weekly_goal then
      awarded_weekly_bonus := 0;
    end if;
  end if;

  points_earned_this_checkin := 10 + awarded_weekly_bonus;

  update public.profiles
  set total_points = profiles.total_points + points_earned_this_checkin
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
    checkin_time + interval '4 hours',
    current_weekly_goal,
    current_weekly_sessions,
    awarded_weekly_bonus,
    newly_completed_weekly_goal,
    points_earned_this_checkin;
end;
$$;

revoke all on function public.perform_checkin(
  text,
  double precision,
  double precision,
  double precision
) from public, anon;
grant execute on function public.perform_checkin(
  text,
  double precision,
  double precision,
  double precision
) to authenticated;

comment on function public.get_checkin_context(text) is
  'Returns non-sensitive context for an active NFC tag without awarding a check-in.';
comment on function public.perform_checkin(
  text,
  double precision,
  double precision,
  double precision
) is
  'Atomically validates optional venue geofencing, the global cooldown, and weekly rewards before awarding a check-in.';

commit;
