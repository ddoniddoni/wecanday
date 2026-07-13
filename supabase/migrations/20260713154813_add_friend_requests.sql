create table public.friendships (
  id uuid primary key default extensions.gen_random_uuid(),
  requester_id uuid not null references public.profiles(id) on delete cascade,
  addressee_id uuid not null references public.profiles(id) on delete cascade,
  user_low_id uuid generated always as (least(requester_id, addressee_id)) stored,
  user_high_id uuid generated always as (greatest(requester_id, addressee_id)) stored,
  status text not null check (status in ('pending', 'accepted', 'declined', 'cancelled', 'removed')),
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  updated_at timestamptz not null default now(),
  check (requester_id <> addressee_id),
  unique (user_low_id, user_high_id)
);

alter table public.friendships enable row level security;

revoke all on table public.friendships from public, anon, authenticated;
grant select on table public.friendships to authenticated;

create policy "users can read their own friendships"
on public.friendships
for select
to authenticated
using (
  (select auth.uid()) = requester_id
  or (select auth.uid()) = addressee_id
);

create index friendships_requester_pending_idx
on public.friendships(requester_id, updated_at desc)
where status = 'pending';

create index friendships_addressee_pending_idx
on public.friendships(addressee_id, updated_at desc)
where status = 'pending';

create trigger set_friendships_updated_at
before update on public.friendships
for each row execute function private.set_profile_updated_at();

create function public.create_friend_request(p_recipient_id uuid)
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

  if p_recipient_id = caller_id then
    raise exception 'CANNOT_REQUEST_SELF';
  end if;

  if not exists (
    select 1
    from public.profiles as profile
    where profile.id = p_recipient_id
  ) then
    raise exception 'FRIEND_PROFILE_NOT_FOUND';
  end if;

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

create function public.respond_to_friend_request(
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
  friendship public.friendships%rowtype;
begin
  if caller_id is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  if p_response not in ('accepted', 'declined') then
    raise exception 'INVALID_FRIEND_REQUEST_RESPONSE';
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

create function public.cancel_friend_request(p_friendship_id uuid)
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

create function public.list_pending_friend_requests()
returns table (
  id uuid,
  direction text,
  display_name varchar,
  avatar_seed text
)
language sql
security definer
set search_path = ''
stable
as $$
  select
    friendship.id,
    case
      when friendship.addressee_id = (select auth.uid()) then 'incoming'
      else 'outgoing'
    end as direction,
    profile.display_name,
    profile.avatar_seed
  from public.friendships as friendship
  join public.profiles as profile
    on profile.id = case
      when friendship.addressee_id = (select auth.uid()) then friendship.requester_id
      else friendship.addressee_id
    end
  where friendship.status = 'pending'
    and ((select auth.uid()) in (friendship.requester_id, friendship.addressee_id))
  order by friendship.updated_at desc;
$$;

revoke all on function public.create_friend_request(uuid) from public, anon;
revoke all on function public.respond_to_friend_request(uuid, text) from public, anon;
revoke all on function public.cancel_friend_request(uuid) from public, anon;
revoke all on function public.list_pending_friend_requests() from public, anon;
grant execute on function public.create_friend_request(uuid) to authenticated;
grant execute on function public.respond_to_friend_request(uuid, text) to authenticated;
grant execute on function public.cancel_friend_request(uuid) to authenticated;
grant execute on function public.list_pending_friend_requests() to authenticated;
