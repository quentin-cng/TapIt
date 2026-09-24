-- Mutual friend requests. Existing rows in public.friendships remain accepted.

begin;

create table public.friend_requests (
  id uuid primary key default gen_random_uuid(),
  requester_id uuid not null references public.profiles (id) on delete cascade,
  recipient_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint friend_requests_distinct_users check (requester_id <> recipient_id)
);

-- Only one pending request may exist for an unordered pair, regardless of who
-- sent it. This prevents duplicate and crossing requests at the database layer.
create unique index friend_requests_pair_unique_idx
  on public.friend_requests (
    least(requester_id, recipient_id),
    greatest(requester_id, recipient_id)
  );

create index friend_requests_recipient_recent_idx
  on public.friend_requests (recipient_id, created_at desc);
create index friend_requests_requester_recent_idx
  on public.friend_requests (requester_id, created_at desc);

alter table public.friend_requests enable row level security;

revoke all on table public.friend_requests from anon, authenticated;
grant select on table public.friend_requests to authenticated;

create policy "Participants can view their friend requests"
  on public.friend_requests
  for select
  to authenticated
  using ((select auth.uid()) in (requester_id, recipient_id));

-- Accepted friendships can no longer be forged or removed with direct table
-- writes. All transitions below re-check auth.uid() inside SECURITY DEFINER RPCs.
revoke insert, delete on table public.friendships from authenticated;

drop policy if exists "Users can create their own friendships"
  on public.friendships;
drop policy if exists "Users can remove their own friendships"
  on public.friendships;

create or replace function public.send_friend_request(p_recipient_id uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_current_user_id uuid := auth.uid();
  v_request public.friend_requests%rowtype;
  v_user_id uuid;
  v_friend_id uuid;
begin
  if v_current_user_id is null then
    raise exception using
      errcode = '42501',
      message = 'Authentication is required to send a friend request.';
  end if;

  if p_recipient_id is null or p_recipient_id = v_current_user_id then
    raise exception using
      errcode = '22023',
      message = 'A friend request requires another user.';
  end if;

  perform 1
  from public.profiles as profile
  where profile.id = p_recipient_id;

  if not found then
    return 'not_found';
  end if;

  v_user_id := least(v_current_user_id, p_recipient_id);
  v_friend_id := greatest(v_current_user_id, p_recipient_id);

  -- Serialize every transition for this unordered user pair. A hash collision
  -- only causes harmless extra serialization; it cannot merge relationships.
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(v_user_id::text || ':' || v_friend_id::text, 0)
  );

  if exists (
    select 1
    from public.friendships as friendship
    where friendship.user_id = v_user_id
      and friendship.friend_id = v_friend_id
  ) then
    return 'friends';
  end if;

  select request.*
  into v_request
  from public.friend_requests as request
  where least(request.requester_id, request.recipient_id) = v_user_id
    and greatest(request.requester_id, request.recipient_id) = v_friend_id
  for update;

  if found then
    if v_request.requester_id = v_current_user_id then
      return 'requested';
    end if;

    -- A reverse request is the recipient expressing mutual consent, so accept
    -- it instead of creating a duplicate crossing request.
    insert into public.friendships (user_id, friend_id)
    values (v_user_id, v_friend_id)
    on conflict on constraint friendships_pkey do nothing;

    delete from public.friend_requests
    where id = v_request.id;

    return 'accepted';
  end if;

  insert into public.friend_requests (requester_id, recipient_id)
  values (v_current_user_id, p_recipient_id);

  return 'sent';
end;
$$;

create or replace function public.accept_friend_request(p_request_id uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_current_user_id uuid := auth.uid();
  v_request public.friend_requests%rowtype;
  v_user_id uuid;
  v_friend_id uuid;
begin
  if v_current_user_id is null then
    raise exception using
      errcode = '42501',
      message = 'Authentication is required to accept a friend request.';
  end if;

  select request.*
  into v_request
  from public.friend_requests as request
  where request.id = p_request_id;

  if not found or v_request.recipient_id <> v_current_user_id then
    return 'not_found';
  end if;

  v_user_id := least(v_request.requester_id, v_request.recipient_id);
  v_friend_id := greatest(v_request.requester_id, v_request.recipient_id);

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(v_user_id::text || ':' || v_friend_id::text, 0)
  );

  select request.*
  into v_request
  from public.friend_requests as request
  where request.id = p_request_id
    and request.recipient_id = v_current_user_id
  for update;

  if not found then
    return 'not_found';
  end if;

  insert into public.friendships (user_id, friend_id)
  values (v_user_id, v_friend_id)
  on conflict on constraint friendships_pkey do nothing;

  delete from public.friend_requests
  where id = v_request.id;

  return 'accepted';
end;
$$;

create or replace function public.decline_friend_request(p_request_id uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_current_user_id uuid := auth.uid();
  v_request public.friend_requests%rowtype;
begin
  if v_current_user_id is null then
    raise exception using
      errcode = '42501',
      message = 'Authentication is required to decline a friend request.';
  end if;

  select request.*
  into v_request
  from public.friend_requests as request
  where request.id = p_request_id;

  if not found or v_request.recipient_id <> v_current_user_id then
    return 'not_found';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(
      least(v_request.requester_id, v_request.recipient_id)::text
      || ':' ||
      greatest(v_request.requester_id, v_request.recipient_id)::text,
      0
    )
  );

  delete from public.friend_requests as request
  where request.id = p_request_id
    and request.recipient_id = v_current_user_id;

  return case when found then 'declined' else 'not_found' end;
end;
$$;

create or replace function public.cancel_friend_request(p_request_id uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_current_user_id uuid := auth.uid();
  v_request public.friend_requests%rowtype;
begin
  if v_current_user_id is null then
    raise exception using
      errcode = '42501',
      message = 'Authentication is required to cancel a friend request.';
  end if;

  select request.*
  into v_request
  from public.friend_requests as request
  where request.id = p_request_id;

  if not found or v_request.requester_id <> v_current_user_id then
    return 'not_found';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(
      least(v_request.requester_id, v_request.recipient_id)::text
      || ':' ||
      greatest(v_request.requester_id, v_request.recipient_id)::text,
      0
    )
  );

  delete from public.friend_requests as request
  where request.id = p_request_id
    and request.requester_id = v_current_user_id;

  return case when found then 'cancelled' else 'not_found' end;
end;
$$;

create or replace function public.remove_friend(p_friend_id uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_current_user_id uuid := auth.uid();
  v_user_id uuid;
  v_friend_id uuid;
begin
  if v_current_user_id is null then
    raise exception using
      errcode = '42501',
      message = 'Authentication is required to remove a friend.';
  end if;

  if p_friend_id is null or p_friend_id = v_current_user_id then
    return 'not_found';
  end if;

  v_user_id := least(v_current_user_id, p_friend_id);
  v_friend_id := greatest(v_current_user_id, p_friend_id);

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(v_user_id::text || ':' || v_friend_id::text, 0)
  );

  delete from public.friendships as friendship
  where friendship.user_id = v_user_id
    and friendship.friend_id = v_friend_id;

  return case when found then 'removed' else 'not_found' end;
end;
$$;

revoke all on function public.send_friend_request(uuid) from public, anon;
revoke all on function public.accept_friend_request(uuid) from public, anon;
revoke all on function public.decline_friend_request(uuid) from public, anon;
revoke all on function public.cancel_friend_request(uuid) from public, anon;
revoke all on function public.remove_friend(uuid) from public, anon;

grant execute on function public.send_friend_request(uuid) to authenticated;
grant execute on function public.accept_friend_request(uuid) to authenticated;
grant execute on function public.decline_friend_request(uuid) to authenticated;
grant execute on function public.cancel_friend_request(uuid) to authenticated;
grant execute on function public.remove_friend(uuid) to authenticated;

comment on table public.friend_requests is
  'Pending mutual friend requests. Accepted relationships remain in public.friendships.';
comment on function public.send_friend_request(uuid) is
  'Sends a pending request or atomically accepts an existing reverse request.';

commit;
