-- Keep the final onboarding payoff restart-safe and authoritative. Existing
-- profiles are grandfathered in; future profiles must explicitly acknowledge
-- completion after every required setup contract is satisfied.

begin;

alter table public.profiles
  add column onboarding_completed_at timestamptz;

update public.profiles
set onboarding_completed_at = now()
where onboarding_completed_at is null;

comment on column public.profiles.onboarding_completed_at is
  'Timestamp when the authenticated user completed the full TapIt onboarding experience.';

create function public.complete_my_onboarding()
returns timestamptz
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_current_user_id uuid := auth.uid();
  v_avatar_selected_at timestamptz;
  v_display_name text;
  v_username text;
  v_generated_username text;
  v_onboarding_completed_at timestamptz;
  v_has_weekly_goal boolean;
begin
  if v_current_user_id is null then
    raise exception using
      errcode = '42501',
      message = 'Authentication is required to complete onboarding.';
  end if;

  select
    profile.avatar_selected_at,
    profile.display_name,
    profile.username,
    profile.onboarding_completed_at
  into
    v_avatar_selected_at,
    v_display_name,
    v_username,
    v_onboarding_completed_at
  from public.profiles as profile
  where profile.id = v_current_user_id
  for update;

  if not found then
    raise exception using
      errcode = 'P0002',
      message = 'The authenticated profile does not exist.';
  end if;

  if v_onboarding_completed_at is not null then
    return v_onboarding_completed_at;
  end if;

  v_generated_username :=
    'user_' || left(replace(v_current_user_id::text, '-', ''), 12);

  if v_avatar_selected_at is null then
    raise exception using
      errcode = '23514',
      message = 'Avatar selection is required before completing onboarding.';
  end if;

  if v_username = v_generated_username
     or v_username !~ '^[a-z0-9_]{3,30}$'
     or char_length(btrim(coalesce(v_display_name, ''))) not between 1 and 30
     or v_display_name ~ '[[:cntrl:]]'
     or v_display_name ~ '^[[:space:]]|[[:space:]]$' then
    raise exception using
      errcode = '23514',
      message = 'Profile identity is required before completing onboarding.';
  end if;

  select exists (
    select 1
    from public.weekly_goal_schedules as schedule
    where schedule.user_id = v_current_user_id
  )
  into v_has_weekly_goal;

  if not v_has_weekly_goal then
    raise exception using
      errcode = '23514',
      message = 'A weekly goal is required before completing onboarding.';
  end if;

  update public.profiles as profile
  set onboarding_completed_at = now()
  where profile.id = v_current_user_id
    and profile.onboarding_completed_at is null
  returning profile.onboarding_completed_at
  into v_onboarding_completed_at;

  return v_onboarding_completed_at;
end;
$$;

drop function public.get_my_profile();

create function public.get_my_profile()
returns table (
  display_name text,
  username text,
  total_points integer,
  created_at timestamptz,
  avatar_id text,
  avatar_selected_at timestamptz,
  onboarding_completed_at timestamptz
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
    profile.created_at,
    profile.avatar_id,
    profile.avatar_selected_at,
    profile.onboarding_completed_at
  from public.profiles as profile
  where profile.id = v_current_user_id;
end;
$$;

revoke all on function public.complete_my_onboarding()
  from public, anon, authenticated;
revoke all on function public.get_my_profile()
  from public, anon, authenticated;

grant execute on function public.complete_my_onboarding()
  to authenticated;
grant execute on function public.get_my_profile()
  to authenticated;

comment on function public.complete_my_onboarding() is
  'Idempotently completes auth.uid() onboarding only after authoritative setup prerequisites exist.';

commit;
