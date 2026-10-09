-- Track explicit avatar selection separately from the safe default avatar so
-- onboarding readiness remains authoritative for newly created accounts.

begin;

alter table public.profiles
  add column avatar_selected_at timestamptz;

-- Every profile that predates this onboarding step is already configured.
-- The column intentionally has no default, so profiles created after this
-- migration remain incomplete until set_my_avatar() succeeds.
update public.profiles
set avatar_selected_at = now()
where avatar_selected_at is null;

comment on column public.profiles.avatar_selected_at is
  'Timestamp of the user''s explicit onboarding/profile avatar selection.';

create or replace function public.set_my_avatar(p_avatar_id text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_current_user_id uuid := auth.uid();
  v_avatar_id text;
begin
  if v_current_user_id is null then
    raise exception using
      errcode = '42501',
      message = 'Authentication is required to update an avatar.';
  end if;

  if p_avatar_id is null or p_avatar_id not in (
    'default', 'mountain', 'sunset', 'forest', 'moon'
  ) then
    raise exception using
      errcode = '22023',
      message = 'Avatar identifier is invalid.';
  end if;

  update public.profiles as profile
  set
    avatar_id = p_avatar_id,
    avatar_selected_at = now()
  where profile.id = v_current_user_id
  returning profile.avatar_id into v_avatar_id;

  if not found then
    raise exception using
      errcode = 'P0002',
      message = 'The authenticated profile does not exist.';
  end if;

  return v_avatar_id;
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
  avatar_selected_at timestamptz
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
    profile.avatar_selected_at
  from public.profiles as profile
  where profile.id = v_current_user_id;
end;
$$;

revoke all on function public.set_my_avatar(text)
  from public, anon, authenticated;
revoke all on function public.get_my_profile()
  from public, anon, authenticated;

grant execute on function public.set_my_avatar(text)
  to authenticated;
grant execute on function public.get_my_profile()
  to authenticated;

comment on function public.set_my_avatar(text) is
  'Validates and atomically records auth.uid() avatar selection.';

commit;
