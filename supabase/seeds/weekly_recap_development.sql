-- OPTIONAL DEVELOPMENT-ONLY seed for previous-week recap data.
-- Replace every placeholder username below with an existing test username.
-- Use distinct users who are friends with the account viewing /recap.
-- This script is idempotent for its exact seeded timestamps. Do not run it in production.

begin;

create temporary table recap_seed_targets (
  username text primary key,
  previous_goal integer check (previous_goal between 1 and 7),
  sessions integer not null check (sessions between 0 and 7)
) on commit drop;

insert into recap_seed_targets (username, previous_goal, sessions)
values
  ('replace_with_hit_username', 3, 3),
  ('replace_with_missed_username', 3, 1),
  ('replace_with_no_goal_username', null, 0);

do $$
declare
  v_current_week date := date_trunc(
    'week',
    timezone('America/Montreal', statement_timestamp())
  )::date;
  v_previous_week date;
  v_tag_id uuid;
  v_location_id uuid;
  v_target_count integer;
  v_profile_count integer;
begin
  v_previous_week := v_current_week - 7;

  if exists (
    select 1
    from recap_seed_targets as target
    where target.username like 'replace_with_%'
  ) then
    raise exception 'Replace all recap seed placeholder usernames before running.';
  end if;

  select count(*) into v_target_count from recap_seed_targets;

  select count(*)
  into v_profile_count
  from public.profiles as profile
  join recap_seed_targets as target on target.username = profile.username;

  if v_profile_count <> v_target_count then
    raise exception 'One or more recap seed usernames do not exist.';
  end if;

  if exists (
    select 1
    from recap_seed_targets as target
    join public.profiles as profile on profile.username = target.username
    join public.weekly_goal_schedules as schedule
      on schedule.user_id = profile.id
     and schedule.effective_week <= v_previous_week
    where target.previous_goal is null
  ) then
    raise exception 'The NO GOAL seed user already had a goal last week; choose another test user.';
  end if;

  select tag.id, tag.location_id
  into v_tag_id, v_location_id
  from public.nfc_tags as tag
  where tag.is_active = true
  order by tag.created_at
  limit 1;

  if v_tag_id is null then
    raise exception 'No active NFC tag exists. Run the development location seed first.';
  end if;

  insert into public.weekly_goal_schedules (
    user_id,
    effective_week,
    goal_sessions
  )
  select profile.id, v_previous_week, target.previous_goal
  from recap_seed_targets as target
  join public.profiles as profile on profile.username = target.username
  where target.previous_goal is not null
  on conflict on constraint weekly_goal_schedules_pkey do update
  set goal_sessions = excluded.goal_sessions,
      updated_at = statement_timestamp();

  insert into public.checkins (
    user_id,
    location_id,
    nfc_tag_id,
    points_awarded,
    created_at
  )
  select
    profile.id,
    v_location_id,
    v_tag_id,
    10,
    (
      (v_previous_week + (generated.session_number - 1))::timestamp
      + interval '12 hours'
    ) at time zone 'America/Montreal'
  from recap_seed_targets as target
  join public.profiles as profile on profile.username = target.username
  cross join lateral generate_series(1, target.sessions) as generated(session_number)
  where not exists (
    select 1
    from public.checkins as existing
    where existing.user_id = profile.id
      and existing.created_at = (
        (
          (v_previous_week + (generated.session_number - 1))::timestamp
          + interval '12 hours'
        ) at time zone 'America/Montreal'
      )
  );

  insert into public.weekly_goal_completions (
    user_id,
    week_start,
    goal_sessions,
    sessions_at_completion,
    bonus_points,
    completed_at
  )
  select
    profile.id,
    v_previous_week,
    target.previous_goal,
    target.sessions,
    target.previous_goal * 5,
    (
      (v_previous_week + (target.sessions - 1))::timestamp
      + interval '12 hours'
    ) at time zone 'America/Montreal'
  from recap_seed_targets as target
  join public.profiles as profile on profile.username = target.username
  where target.previous_goal is not null
    and target.sessions >= target.previous_goal
  on conflict (user_id, week_start) do nothing;

  update public.profiles as profile
  set total_points =
    coalesce((
      select sum(checkin.points_awarded)
      from public.checkins as checkin
      where checkin.user_id = profile.id
    ), 0)
    + coalesce((
      select sum(completion.bonus_points)
      from public.weekly_goal_completions as completion
      where completion.user_id = profile.id
    ), 0)
  where profile.id in (
    select selected_profile.id
    from public.profiles as selected_profile
    join recap_seed_targets as target
      on target.username = selected_profile.username
  );
end;
$$;

commit;
