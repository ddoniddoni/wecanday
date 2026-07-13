create table public.user_blocks (
  blocker_id uuid not null references public.profiles(id) on delete cascade,
  blocked_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

alter table public.user_blocks enable row level security;

revoke all on table public.user_blocks from public, anon, authenticated;
create index user_blocks_blocked_id_idx on public.user_blocks(blocked_id);

create table private.friend_code_lookup_rate_limits (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  window_started_at timestamptz not null,
  attempt_count smallint not null check (attempt_count >= 1)
);

revoke all on table private.friend_code_lookup_rate_limits from public, anon, authenticated;

create function public.lookup_profile_by_public_code(p_public_code text)
returns table (
  id uuid,
  display_name varchar,
  avatar_seed text
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  current_window timestamptz := date_trunc('minute', clock_timestamp());
  current_attempt_count smallint;
begin
  if caller_id is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  if p_public_code !~ '^[A-Za-z0-9]{12}$' then
    return;
  end if;

  insert into private.friend_code_lookup_rate_limits as rate_limit (
    user_id,
    window_started_at,
    attempt_count
  )
  values (caller_id, current_window, 1)
  on conflict (user_id) do update
  set
    window_started_at = case
      when rate_limit.window_started_at = excluded.window_started_at
        then rate_limit.window_started_at
      else excluded.window_started_at
    end,
    attempt_count = case
      when rate_limit.window_started_at = excluded.window_started_at
        then rate_limit.attempt_count + 1
      else 1
    end
  returning attempt_count into current_attempt_count;

  if current_attempt_count > 10 then
    raise exception 'FRIEND_CODE_RATE_LIMITED';
  end if;

  return query
  select
    profile.id,
    profile.display_name,
    profile.avatar_seed
  from public.profiles as profile
  where profile.public_code collate "C" = p_public_code collate "C"
    and profile.id <> caller_id
    and not exists (
      select 1
      from public.user_blocks as user_block
      where (user_block.blocker_id = caller_id and user_block.blocked_id = profile.id)
        or (user_block.blocker_id = profile.id and user_block.blocked_id = caller_id)
    )
  limit 1;
end;
$$;

revoke all on function public.lookup_profile_by_public_code(text) from public, anon;
grant execute on function public.lookup_profile_by_public_code(text) to authenticated;
