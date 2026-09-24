-- Fix a runtime PL/pgSQL ambiguity in configure_weekly_goal.
-- The RETURNS TABLE output variable `effective_week` conflicted with the
-- unqualified ON CONFLICT (user_id, effective_week) inference expression.

begin;

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
  v_current_user_id uuid := auth.uid();
  v_current_week date;
  v_selected_week date;
  v_has_existing_goal boolean;
begin
  if v_current_user_id is null then
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
  from public.profiles as profile
  where profile.id = v_current_user_id
  for update;

  if not found then
    raise exception using
      errcode = 'P0001',
      message = 'Profile not found for authenticated user.';
  end if;

  v_current_week := pg_catalog.date_trunc(
    'week',
    pg_catalog.timezone('America/Montreal', pg_catalog.clock_timestamp())
  )::date;

  select exists (
    select 1
    from public.weekly_goal_schedules as schedule
    where schedule.user_id = v_current_user_id
  )
  into v_has_existing_goal;

  v_selected_week := case
    when v_has_existing_goal then v_current_week + 7
    else v_current_week
  end;

  insert into public.weekly_goal_schedules (
    user_id,
    effective_week,
    goal_sessions
  )
  values (
    v_current_user_id,
    v_selected_week,
    p_goal_sessions
  )
  on conflict on constraint weekly_goal_schedules_pkey do update
  set goal_sessions = excluded.goal_sessions,
      updated_at = pg_catalog.clock_timestamp();

  return query
  select
    p_goal_sessions,
    v_selected_week,
    v_selected_week = v_current_week;
end;
$$;

revoke all on function public.configure_weekly_goal(integer)
  from public, anon;
grant execute on function public.configure_weekly_goal(integer)
  to authenticated;

comment on function public.configure_weekly_goal(integer) is
  'Configures the authenticated user weekly goal without allowing active or historical goals to be changed.';

commit;
