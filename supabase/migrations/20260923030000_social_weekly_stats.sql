-- Limited social weekly statistics for the authenticated user and current friends.

begin;

create or replace function public.get_social_weekly_stats()
returns table (
  participant_user_id uuid,
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
  v_current_week date;
  v_previous_week date;
begin
  if v_current_user_id is null then
    raise exception using
      errcode = '42501',
      message = 'Authentication is required to view social weekly statistics.';
  end if;

  v_current_week := pg_catalog.date_trunc(
    'week',
    pg_catalog.timezone('America/Montreal', pg_catalog.statement_timestamp())
  )::date;
  v_previous_week := v_current_week - 7;

  return query
  with participant_ids as (
    select v_current_user_id as participant_id

    union

    select
      case
        when friendship.user_id = v_current_user_id then friendship.friend_id
        else friendship.user_id
      end as participant_id
    from public.friendships as friendship
    where friendship.user_id = v_current_user_id
       or friendship.friend_id = v_current_user_id
  ),
  participant_profiles as (
    select
      profile.id as participant_id,
      profile.username as participant_username,
      profile.total_points as participant_total_points
    from participant_ids as participant
    join public.profiles as profile
      on profile.id = participant.participant_id
  ),
  first_goals as (
    select
      participant.participant_id,
      min(schedule.effective_week) as first_goal_week
    from participant_profiles as participant
    left join public.weekly_goal_schedules as schedule
      on schedule.user_id = participant.participant_id
     and schedule.effective_week <= v_current_week
    group by participant.participant_id
  ),
  calendar_weeks as (
    select
      first_goal.participant_id,
      generated.week_value::date as week_start
    from first_goals as first_goal
    cross join lateral pg_catalog.generate_series(
      first_goal.first_goal_week::timestamp,
      v_current_week::timestamp,
      interval '7 days'
    ) as generated(week_value)
    where first_goal.first_goal_week is not null
  ),
  week_metrics as (
    select
      calendar.participant_id,
      calendar.week_start,
      goal.goal_sessions,
      sessions.completed_sessions
    from calendar_weeks as calendar
    left join lateral (
      select schedule.goal_sessions::integer as goal_sessions
      from public.weekly_goal_schedules as schedule
      where schedule.user_id = calendar.participant_id
        and schedule.effective_week <= calendar.week_start
      order by schedule.effective_week desc
      limit 1
    ) as goal on true
    cross join lateral (
      select count(*)::integer as completed_sessions
      from public.checkins as checkin
      where checkin.user_id = calendar.participant_id
        and checkin.points_awarded > 0
        and checkin.created_at >= (
          calendar.week_start::timestamp at time zone 'America/Montreal'
        )
        and checkin.created_at < (
          (calendar.week_start + 7)::timestamp at time zone 'America/Montreal'
        )
    ) as sessions
  ),
  eligible_outcomes as (
    select
      metric.participant_id,
      metric.week_start,
      metric.completed_sessions >= metric.goal_sessions as achieved
    from week_metrics as metric
    where metric.goal_sessions is not null
      and (
        metric.week_start < v_current_week
        or metric.completed_sessions >= metric.goal_sessions
      )
  ),
  grouped_outcomes as (
    select
      outcome.participant_id,
      outcome.week_start,
      outcome.achieved,
      sum(case when outcome.achieved then 0 else 1 end) over (
        partition by outcome.participant_id
        order by outcome.week_start
      ) as streak_group
    from eligible_outcomes as outcome
  ),
  streak_runs as (
    select
      grouped.participant_id,
      grouped.streak_group,
      count(*) filter (where grouped.achieved)::integer as run_length
    from grouped_outcomes as grouped
    group by grouped.participant_id, grouped.streak_group
  ),
  streak_stats as (
    select
      run.participant_id,
      max(run.run_length)::integer as best_streak,
      coalesce(
        (array_agg(run.run_length order by run.streak_group desc))[1],
        0
      )::integer as current_streak
    from streak_runs as run
    group by run.participant_id
  )
  select
    participant.participant_id,
    participant.participant_username,
    participant.participant_total_points,
    v_current_week,
    current_goal.goal_sessions,
    current_sessions.completed_sessions,
    case
      when current_goal.goal_sessions is null then null
      else current_sessions.completed_sessions >= current_goal.goal_sessions
    end,
    v_previous_week,
    previous_goal.goal_sessions,
    previous_sessions.completed_sessions,
    case
      when previous_goal.goal_sessions is null then null
      else previous_sessions.completed_sessions >= previous_goal.goal_sessions
    end,
    (
      previous_sessions.checkin_points
      + previous_bonus.bonus_points
    )::integer,
    coalesce(streak.current_streak, 0),
    coalesce(streak.best_streak, 0)
  from participant_profiles as participant
  left join lateral (
    select schedule.goal_sessions::integer as goal_sessions
    from public.weekly_goal_schedules as schedule
    where schedule.user_id = participant.participant_id
      and schedule.effective_week <= v_current_week
    order by schedule.effective_week desc
    limit 1
  ) as current_goal on true
  cross join lateral (
    select count(*)::integer as completed_sessions
    from public.checkins as checkin
    where checkin.user_id = participant.participant_id
      and checkin.points_awarded > 0
      and checkin.created_at >= (
        v_current_week::timestamp at time zone 'America/Montreal'
      )
      and checkin.created_at < (
        (v_current_week + 7)::timestamp at time zone 'America/Montreal'
      )
  ) as current_sessions
  left join lateral (
    select schedule.goal_sessions::integer as goal_sessions
    from public.weekly_goal_schedules as schedule
    where schedule.user_id = participant.participant_id
      and schedule.effective_week <= v_previous_week
    order by schedule.effective_week desc
    limit 1
  ) as previous_goal on true
  cross join lateral (
    select
      count(*)::integer as completed_sessions,
      coalesce(sum(checkin.points_awarded), 0)::integer as checkin_points
    from public.checkins as checkin
    where checkin.user_id = participant.participant_id
      and checkin.points_awarded > 0
      and checkin.created_at >= (
        v_previous_week::timestamp at time zone 'America/Montreal'
      )
      and checkin.created_at < (
        (v_previous_week + 7)::timestamp at time zone 'America/Montreal'
      )
  ) as previous_sessions
  cross join lateral (
    select coalesce(sum(completion.bonus_points), 0)::integer as bonus_points
    from public.weekly_goal_completions as completion
    where completion.user_id = participant.participant_id
      and completion.week_start = v_previous_week
  ) as previous_bonus
  left join streak_stats as streak
    on streak.participant_id = participant.participant_id
  order by participant.participant_username, participant.participant_id;
end;
$$;

revoke all on function public.get_social_weekly_stats()
  from public, anon;
grant execute on function public.get_social_weekly_stats()
  to authenticated;

comment on function public.get_social_weekly_stats() is
  'Returns limited weekly fitness statistics only for the authenticated user and their current friends.';

commit;
