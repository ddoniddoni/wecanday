create table public.device_push_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  expo_push_token text not null unique,
  platform text not null check (platform in ('android', 'ios')),
  device_id_hash text not null check (device_id_hash ~ '^[a-f0-9]{64}$'),
  locale varchar(16) not null check (locale ~ '^[A-Za-z]{2,3}(-[A-Za-z0-9]{2,8})*$'),
  enabled boolean not null default true,
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, platform, device_id_hash)
);

create index device_push_tokens_enabled_user_idx
on public.device_push_tokens(user_id)
where enabled;

alter table public.device_push_tokens enable row level security;

revoke all on table public.device_push_tokens from anon, authenticated;

create trigger set_device_push_tokens_updated_at
before update on public.device_push_tokens
for each row execute function private.set_timestamp_updated_at();

create function public.upsert_device_push_token(
  p_device_id_hash text,
  p_expo_push_token text,
  p_locale text,
  p_platform text
)
returns public.device_push_tokens
language plpgsql
security definer
set search_path = ''
as $$
declare
  caller_id uuid := auth.uid();
  push_token public.device_push_tokens%rowtype;
begin
  if caller_id is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  if p_platform not in ('android', 'ios') then
    raise exception 'INVALID_PUSH_PLATFORM';
  end if;

  if p_device_id_hash is null or p_device_id_hash !~ '^[a-f0-9]{64}$' then
    raise exception 'INVALID_PUSH_DEVICE';
  end if;

  if p_expo_push_token is null
    or p_expo_push_token !~ '^(Exponent|Expo)PushToken\[[^]]+\]$' then
    raise exception 'INVALID_EXPO_PUSH_TOKEN';
  end if;

  if p_locale is null or p_locale !~ '^[A-Za-z]{2,3}(-[A-Za-z0-9]{2,8})*$' then
    raise exception 'INVALID_PUSH_LOCALE';
  end if;

  -- A device may be shared. Replace its prior registration so a former
  -- account cannot receive social notifications on the newly active account.
  delete from public.device_push_tokens
  where expo_push_token = p_expo_push_token
    or (platform = p_platform and device_id_hash = p_device_id_hash);

  insert into public.device_push_tokens (
    user_id,
    expo_push_token,
    platform,
    device_id_hash,
    locale,
    enabled,
    last_seen_at
  )
  values (
    caller_id,
    p_expo_push_token,
    p_platform,
    p_device_id_hash,
    p_locale,
    true,
    now()
  )
  returning * into push_token;

  return push_token;
end;
$$;

create function public.disable_current_device_push_token(
  p_device_id_hash text,
  p_platform text
)
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

  if p_platform not in ('android', 'ios') then
    raise exception 'INVALID_PUSH_PLATFORM';
  end if;

  if p_device_id_hash is null or p_device_id_hash !~ '^[a-f0-9]{64}$' then
    raise exception 'INVALID_PUSH_DEVICE';
  end if;

  update public.device_push_tokens
  set enabled = false, last_seen_at = now()
  where user_id = caller_id
    and platform = p_platform
    and device_id_hash = p_device_id_hash;
end;
$$;

revoke all on function public.upsert_device_push_token(text, text, text, text) from public, anon;
revoke all on function public.disable_current_device_push_token(text, text) from public, anon;
grant execute on function public.upsert_device_push_token(text, text, text, text) to authenticated;
grant execute on function public.disable_current_device_push_token(text, text) to authenticated;
