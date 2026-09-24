-- TapIt weekly training goals and atomic weekly completion bonuses.
-- Run once after 20260923000000_initial_schema.sql.

begin;

create table public.weekly_goal_schedules (
  user_id uuid not null references public.profiles (id) on delete cascade,
  effective_week date not null,
  goal_sessions smallint not null check (goal_sessions between 1 and 7),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, effective_week),
  constraint weekly_goal_schedules_monday check (
    extract(isodow from effective_week) = 1
  )
);

comment on table public.weekly_goal_schedules is
  'Append-only weekly goal history. Only a pending next-week row may be replaced through configure_weekly_goal.';

create table public.weekly_goal_completions (
  user_id uuid not null references public.profiles (id) on delete cascade,
  week_start date not null,
  goal_sessions smallint not null check (goal_sessions between 1 and 7),
  sessions_at_completion integer not null check (sessions_at_completion >= goal_sessions),
  bonus_points integer not null check (bonus_points = goal_sessions * 5),
  completed_at timestamptz not null default now(),
  primary key (user_id, week_start),
  constraint weekly_goal_completions_monday check (
    extract(isodow from week_start) = 1
  )
);

comment on table public.weekly_goal_completions is
  'Durable reward ledger: the primary key guarantees at most one weekly bonus per user and week.';

alter table public.weekly_goal_schedules enable row level security;
alter table public.weekly_goal_completions enable row level security;

revoke all on table public.weekly_goal_schedules from anon, authenticated;
revoke all on table public.weekly_goal_completions from anon, authenticated;

grant select on table public.weekly_goal_schedules to authenticated;
grant select on table public.weekly_goal_completions to authenticated;

create policy "Users can view their own weekly goal history"
  on public.weekly_goal_schedules
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can view their own weekly completions"
  on public.weekly_goal_completions
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

-- First configuration applies to the current Montreal week. Every later
-- configuration applies next Monday. Repeated changes before that Monday replace
-- only the pending row, preserving all active and historical goals.
create or replace function public.configure_weekly_goal(p_goal_sessions integer)
returns table (
  goal_sessions integer,
  effective_week date,
  applies_current_week boolean
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_user_id uuid := auth.uid();
  current_week date;
  selected_week date;
  has_existing_goal boolean;
begin
  if current_user_id is null then
    raise exception using
      errcode = '42501',
      message = 'Authentication is required to configure a weekly goal.';
  end if;

  if p_goal_sessions is null or p_goal_sessions < 1 or p_goal_sessions > 7 then
    raise exception using
      errcode = '22023',
      message = 'Weekly goal must be between 1 and 7 sessions.';
  end if;

  perform 1
  from public.profiles
  where id = current_user_id
  for update;

  if not found then
    raise exception using
      errcode = 'P0001',
      message = 'Profile not found for authenticated user.';
  end if;

  current_week := date_trunc(
    'week',
    pg_catalog.timezone('America/Montreal', pg_catalog.clock_timestamp())
  )::date;

  select exists (
    select 1
    from public.weekly_goal_schedules as schedule
    where schedule.user_id = current_user_id
  )
  into has_existing_goal;

  selected_week := case
    when has_existing_goal then current_week + 7
    else current_week
  end;

  insert into public.weekly_goal_schedules (
    user_id,
    effective_week,
    goal_sessions
  )
  values (
    current_user_id,
    selected_week,
    p_goal_sessions
  )
  on conflict (user_id, effective_week) do update
  set goal_sessions = excluded.goal_sessions,
      updated_at = pg_catalog.clock_timestamp();

  return query
  select p_goal_sessions, selected_week, selected_week = current_week;
end;
$$;

revoke all on function public.configure_weekly_goal(integer)
  from public, anon;
grant execute on function public.configure_weekly_goal(integer)
  to authenticated;

-- The return shape is extended with weekly progress and bonus information.
-- DROP + CREATE is required because PostgreSQL cannot replace a function while
-- changing its table return type. The migration itself remains transactional.
drop function public.perform_checkin(text);

create function public.perform_checkin(p_token text)
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
      null::timestamptz,
      null::integer,
      null::integer,
      0,
      false,
      0;
    return;
  end if;

  -- This lock preserves the original cooldown concurrency protection and also
  -- serializes weekly completion/reward attempts for the user.
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
  current_week := date_trunc(
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
    on conflict (user_id, week_start) do nothing
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

revoke all on function public.perform_checkin(text) from public, anon;
grant execute on function public.perform_checkin(text) to authenticated;

comment on function public.perform_checkin(text) is
  'Atomically awards check-in points and an idempotent weekly goal bonus while preserving the global four-hour cooldown.';

commit;
