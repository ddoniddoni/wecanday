create function private.lock_friendship_pair(p_first_user_id uuid, p_second_user_id uuid)
returns void
language plpgsql
set search_path = ''
as $$
begin
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(
      case
        when p_first_user_id::text < p_second_user_id::text
          then p_first_user_id::text || ':' || p_second_user_id::text
        else p_second_user_id::text || ':' || p_first_user_id::text
      end,
      0
    )
  );
end;
$$;

revoke all on function private.lock_friendship_pair(uuid, uuid) from public, anon, authenticated;

create index friendships_requester_accepted_idx
on public.friendships(requester_id, updated_at desc)
where status = 'accepted';

create index friendships_addressee_accepted_idx
on public.friendships(addressee_id, updated_at desc)
where status = 'accepted';

create or replace function public.create_friend_request(p_recipient_id uuid)
returns public.friendships
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  friendship public.friendships%rowtype;
begin
  if caller_id is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  if p_recipient_id is null or not exists (
    select 1
    from public.profiles as profile
    where profile.id = p_recipient_id
  ) then
    raise exception 'FRIEND_PROFILE_NOT_FOUND';
  end if;

  if p_recipient_id = caller_id then
    raise exception 'CANNOT_REQUEST_SELF';
  end if;

  perform private.lock_friendship_pair(caller_id, p_recipient_id);

  if exists (
    select 1
    from public.user_blocks as user_block
    where (user_block.blocker_id = caller_id and user_block.blocked_id = p_recipient_id)
      or (user_block.blocker_id = p_recipient_id and user_block.blocked_id = caller_id)
  ) then
    raise exception 'USER_BLOCKED';
  end if;

  insert into public.friendships as existing (
    requester_id,
    addressee_id,
    status
  )
  values (caller_id, p_recipient_id, 'pending')
  on conflict (user_low_id, user_high_id) do update
  set
    requester_id = case
      when existing.status in ('declined', 'cancelled', 'removed') then caller_id
      else existing.requester_id
    end,
    addressee_id = case
      when existing.status in ('declined', 'cancelled', 'removed') then p_recipient_id
      else existing.addressee_id
    end,
    status = case
      when existing.status = 'pending' and existing.addressee_id = caller_id then 'accepted'
      when existing.status in ('declined', 'cancelled', 'removed') then 'pending'
      else existing.status
    end,
    responded_at = case
      when existing.status = 'pending' and existing.addressee_id = caller_id then now()
      when existing.status in ('declined', 'cancelled', 'removed') then null
      else existing.responded_at
    end
  returning * into friendship;

  return friendship;
end;
$$;

create or replace function public.respond_to_friend_request(
  p_friendship_id uuid,
  p_response text
)
returns public.friendships
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  counterpart_id uuid;
  friendship public.friendships%rowtype;
begin
  if caller_id is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  if p_response not in ('accepted', 'declined') then
    raise exception 'INVALID_FRIEND_REQUEST_RESPONSE';
  end if;

  select requester_id
  into counterpart_id
  from public.friendships
  where id = p_friendship_id
    and addressee_id = caller_id
    and status = 'pending';

  if counterpart_id is null then
    raise exception 'FRIEND_REQUEST_NOT_FOUND';
  end if;

  perform private.lock_friendship_pair(caller_id, counterpart_id);

  if exists (
    select 1
    from public.user_blocks as user_block
    where (user_block.blocker_id = caller_id and user_block.blocked_id = counterpart_id)
      or (user_block.blocker_id = counterpart_id and user_block.blocked_id = caller_id)
  ) then
    raise exception 'USER_BLOCKED';
  end if;

  update public.friendships
  set
    status = p_response,
    responded_at = now()
  where id = p_friendship_id
    and addressee_id = caller_id
    and status = 'pending'
  returning * into friendship;

  if friendship.id is null then
    raise exception 'FRIEND_REQUEST_NOT_FOUND';
  end if;

  return friendship;
end;
$$;

create or replace function public.cancel_friend_request(p_friendship_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  counterpart_id uuid;
begin
  if caller_id is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  select addressee_id
  into counterpart_id
  from public.friendships
  where id = p_friendship_id
    and requester_id = caller_id
    and status = 'pending';

  if counterpart_id is null then
    raise exception 'FRIEND_REQUEST_NOT_FOUND';
  end if;

  perform private.lock_friendship_pair(caller_id, counterpart_id);

  update public.friendships
  set
    status = 'cancelled',
    responded_at = now()
  where id = p_friendship_id
    and requester_id = caller_id
    and status = 'pending';

  if not found then
    raise exception 'FRIEND_REQUEST_NOT_FOUND';
  end if;
end;
$$;

create function public.remove_friend(p_friend_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
begin
  if caller_id is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  perform private.lock_friendship_pair(caller_id, p_friend_id);

  delete from public.friendships
  where status = 'accepted'
    and ((requester_id = caller_id and addressee_id = p_friend_id)
      or (requester_id = p_friend_id and addressee_id = caller_id));

  if not found then
    raise exception 'FRIEND_NOT_FOUND';
  end if;
end;
$$;

create function public.block_user(p_target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
begin
  if caller_id is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  if p_target_user_id = caller_id then
    raise exception 'CANNOT_BLOCK_SELF';
  end if;

  if p_target_user_id is null or not exists (
    select 1
    from public.profiles as profile
    where profile.id = p_target_user_id
  ) then
    raise exception 'FRIEND_PROFILE_NOT_FOUND';
  end if;

  perform private.lock_friendship_pair(caller_id, p_target_user_id);

  insert into public.user_blocks (blocker_id, blocked_id)
  values (caller_id, p_target_user_id)
  on conflict (blocker_id, blocked_id) do nothing;

  delete from public.friendships
  where (requester_id = caller_id and addressee_id = p_target_user_id)
    or (requester_id = p_target_user_id and addressee_id = caller_id);
end;
$$;

create function public.unblock_user(p_target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
begin
  if caller_id is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  delete from public.user_blocks
  where blocker_id = caller_id
    and blocked_id = p_target_user_id;

  if not found then
    raise exception 'BLOCK_NOT_FOUND';
  end if;
end;
$$;

create function public.list_friends()
returns table (
  id uuid,
  display_name varchar,
  avatar_seed text
)
language sql
security definer
set search_path = ''
stable
as $$
  select
    profile.id,
    profile.display_name,
    profile.avatar_seed
  from public.friendships as friendship
  join public.profiles as profile
    on profile.id = case
      when friendship.requester_id = (select auth.uid()) then friendship.addressee_id
      else friendship.requester_id
    end
  where friendship.status = 'accepted'
    and ((select auth.uid()) in (friendship.requester_id, friendship.addressee_id))
  order by friendship.updated_at desc;
$$;

create function public.list_blocked_users()
returns table (
  id uuid,
  display_name varchar,
  avatar_seed text
)
language sql
security definer
set search_path = ''
stable
as $$
  select
    profile.id,
    profile.display_name,
    profile.avatar_seed
  from public.user_blocks as user_block
  join public.profiles as profile on profile.id = user_block.blocked_id
  where user_block.blocker_id = (select auth.uid())
  order by user_block.created_at desc;
$$;

revoke all on function public.remove_friend(uuid) from public, anon;
revoke all on function public.block_user(uuid) from public, anon;
revoke all on function public.unblock_user(uuid) from public, anon;
revoke all on function public.list_friends() from public, anon;
revoke all on function public.list_blocked_users() from public, anon;
grant execute on function public.remove_friend(uuid) to authenticated;
grant execute on function public.block_user(uuid) to authenticated;
grant execute on function public.unblock_user(uuid) to authenticated;
grant execute on function public.list_friends() to authenticated;
grant execute on function public.list_blocked_users() to authenticated;
