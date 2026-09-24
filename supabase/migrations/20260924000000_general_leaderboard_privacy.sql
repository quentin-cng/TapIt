-- Add an opt-out for username visibility on the General leaderboard while
-- keeping every profile ranked. Run once after
-- 20260923060000_privacy_hardening_and_account_deletion.sql.

begin;

alter table public.profiles
  add column show_username_on_general_leaderboard boolean not null default true;

comment on column public.profiles.show_username_on_general_leaderboard is
  'Controls only whether get_global_leaderboard returns the real username; every profile remains ranked.';

create or replace function public.get_global_leaderboard(p_limit integer default 100)
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
    case
      when profile.show_username_on_general_leaderboard then profile.username
      else 'Anonymous'::text
    end,
    profile.total_points,
    profile.id = v_current_user_id
  from public.profiles as profile
  order by profile.total_points desc, profile.created_at asc,
    profile.username asc, profile.id asc
  limit v_limit;
end;
$$;

create function public.get_my_general_leaderboard_preference()
returns boolean
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_current_user_id uuid := auth.uid();
  v_show_username boolean;
begin
  if v_current_user_id is null then
    raise exception using
      errcode = '42501',
      message = 'Authentication is required to view leaderboard preferences.';
  end if;

  select profile.show_username_on_general_leaderboard
  into v_show_username
  from public.profiles as profile
  where profile.id = v_current_user_id;

  if not found then
    raise exception using
      errcode = 'P0002',
      message = 'The authenticated profile does not exist.';
  end if;

  return v_show_username;
end;
$$;

create function public.set_general_leaderboard_preference(p_show_username boolean)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_current_user_id uuid := auth.uid();
  v_show_username boolean;
begin
  if v_current_user_id is null then
    raise exception using
      errcode = '42501',
      message = 'Authentication is required to update leaderboard preferences.';
  end if;

  if p_show_username is null then
    raise exception using
      errcode = '22004',
      message = 'A username visibility preference is required.';
  end if;

  update public.profiles as profile
  set show_username_on_general_leaderboard = p_show_username
  where profile.id = v_current_user_id
  returning profile.show_username_on_general_leaderboard into v_show_username;

  if not found then
    raise exception using
      errcode = 'P0002',
      message = 'The authenticated profile does not exist.';
  end if;

  return v_show_username;
end;
$$;

revoke all on function public.get_global_leaderboard(integer)
  from public, anon, authenticated;
revoke all on function public.get_my_general_leaderboard_preference()
  from public, anon, authenticated;
revoke all on function public.set_general_leaderboard_preference(boolean)
  from public, anon, authenticated;

grant execute on function public.get_global_leaderboard(integer)
  to authenticated;
grant execute on function public.get_my_general_leaderboard_preference()
  to authenticated;
grant execute on function public.set_general_leaderboard_preference(boolean)
  to authenticated;

comment on function public.set_general_leaderboard_preference(boolean) is
  'Updates only auth.uid() username visibility on the General leaderboard.';

commit;
