create table public.check_ins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  routine_item_id uuid not null references public.routine_items(id) on delete cascade,
  routine_day date not null,
  completed_at timestamptz not null,
  received_at timestamptz not null default now(),
  source text not null check (source in ('online', 'offline_sync')),
  idempotency_key uuid not null unique,
  created_at timestamptz not null default now(),
  unique (user_id, routine_item_id, routine_day)
);

create index check_ins_user_id_routine_day_idx
  on public.check_ins(user_id, routine_day);

alter table public.check_ins enable row level security;

revoke all on table public.check_ins from public, anon, authenticated;
grant select, insert, delete on table public.check_ins to authenticated;

create policy "users can read their own check ins"
on public.check_ins
for select
to authenticated
using ((select auth.uid()) = user_id);

create policy "users can write their own check ins through RPC"
on public.check_ins
for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy "users can undo their own check ins through RPC"
on public.check_ins
for delete
to authenticated
using ((select auth.uid()) = user_id);

create function private.prevent_direct_check_in_mutation()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if coalesce(current_setting('app.check_in_mutation', true), '') <> 'allowed' then
    raise exception 'CHECK_IN_MUST_USE_RPC';
  end if;

  return coalesce(new, old);
end;
$$;

revoke all on function private.prevent_direct_check_in_mutation()
  from public, anon, authenticated;

create trigger prevent_direct_check_in_mutation
before insert or delete on public.check_ins
for each row execute function private.prevent_direct_check_in_mutation();

create function private.get_routine_day_for_instant(
  p_instant timestamptz,
  p_time_zone text,
  p_day_start_minute smallint
)
returns date
language sql
stable
set search_path = ''
as $$
  with local_instant as (
    select p_instant at time zone p_time_zone as value
  )
  select (
    value::date - case
      when extract(hour from value)::integer * 60
        + extract(minute from value)::integer < p_day_start_minute
      then 1
      else 0
    end
  )
  from local_instant;
$$;

revoke all on function private.get_routine_day_for_instant(timestamptz, text, smallint)
  from public, anon, authenticated;
grant execute on function private.get_routine_day_for_instant(timestamptz, text, smallint)
  to authenticated;

create function private.assert_check_in_is_valid(
  p_user_id uuid,
  p_routine_item_id uuid,
  p_routine_day date,
  p_occurred_at timestamptz,
  p_source text
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  profile_row public.profiles;
  routine_row public.routine_items;
  calculated_routine_day date;
  current_routine_day date;
begin
  if p_source not in ('online', 'offline_sync') then
    raise exception 'INVALID_CHECK_IN_SOURCE';
  end if;

  if p_occurred_at is null or p_occurred_at > now() + interval '5 minutes' then
    raise exception 'INVALID_CHECK_IN_TIME';
  end if;

  select * into profile_row
  from public.profiles
  where id = p_user_id
    and time_zone is not null
    and day_start_minute is not null;

  if profile_row is null then
    raise exception 'ROUTINE_DAY_SETTINGS_REQUIRED';
  end if;

  calculated_routine_day := private.get_routine_day_for_instant(
    p_occurred_at,
    profile_row.time_zone,
    profile_row.day_start_minute
  );
  current_routine_day := private.get_routine_day_for_instant(
    now(),
    profile_row.time_zone,
    profile_row.day_start_minute
  );

  if calculated_routine_day <> p_routine_day then
    raise exception 'INVALID_ROUTINE_DAY';
  end if;

  if p_source = 'online' and p_routine_day <> current_routine_day then
    raise exception 'CHECK_IN_WINDOW_CLOSED';
  end if;

  select * into routine_row
  from public.routine_items
  where id = p_routine_item_id
    and user_id = p_user_id
    and status = 'active';

  if routine_row is null
    or p_routine_day < routine_row.starts_on
    or (routine_row.ends_on is not null and p_routine_day > routine_row.ends_on)
    or extract(dow from p_routine_day)::smallint <> all(routine_row.schedule_weekdays) then
    raise exception 'ROUTINE_NOT_SCHEDULED';
  end if;
end;
$$;

revoke all on function private.assert_check_in_is_valid(uuid, uuid, date, timestamptz, text)
  from public, anon, authenticated;
grant execute on function private.assert_check_in_is_valid(uuid, uuid, date, timestamptz, text)
  to authenticated;

create function public.complete_check_in(
  p_routine_item_id uuid,
  p_routine_day date,
  p_completed_at timestamptz,
  p_idempotency_key uuid,
  p_source text
)
returns public.check_ins
language plpgsql
security invoker
set search_path = ''
as $$
declare
  existing_check_in public.check_ins;
  created_check_in public.check_ins;
  current_user_id uuid;
begin
  current_user_id := (select auth.uid());

  if current_user_id is null then
    raise exception 'AUTHENTICATION_REQUIRED';
  end if;

  if p_idempotency_key is null then
    raise exception 'INVALID_IDEMPOTENCY_KEY';
  end if;

  select * into existing_check_in
  from public.check_ins
  where idempotency_key = p_idempotency_key;

  if existing_check_in is not null then
    if existing_check_in.user_id <> current_user_id
      or existing_check_in.routine_item_id <> p_routine_item_id
      or existing_check_in.routine_day <> p_routine_day then
      raise exception 'IDEMPOTENCY_KEY_REUSED';
    end if;

    return existing_check_in;
  end if;

  perform private.assert_check_in_is_valid(
    current_user_id,
    p_routine_item_id,
    p_routine_day,
    p_completed_at,
    p_source
  );

  select * into existing_check_in
  from public.check_ins
  where user_id = current_user_id
    and routine_item_id = p_routine_item_id
    and routine_day = p_routine_day;

  if existing_check_in is not null then
    return existing_check_in;
  end if;

  perform set_config('app.check_in_mutation', 'allowed', true);

  insert into public.check_ins (
    user_id,
    routine_item_id,
    routine_day,
    completed_at,
    source,
    idempotency_key
  )
  values (
    current_user_id,
    p_routine_item_id,
    p_routine_day,
    p_completed_at,
    p_source,
    p_idempotency_key
  )
  returning * into created_check_in;

  return created_check_in;
exception
  when unique_violation then
    select * into existing_check_in
    from public.check_ins
    where user_id = current_user_id
      and routine_item_id = p_routine_item_id
      and routine_day = p_routine_day;

    if existing_check_in is not null then
      return existing_check_in;
    end if;

    raise;
end;
$$;

revoke all on function public.complete_check_in(uuid, date, timestamptz, uuid, text)
  from public, anon;
grant execute on function public.complete_check_in(uuid, date, timestamptz, uuid, text)
  to authenticated;

create function public.undo_check_in(
  p_routine_item_id uuid,
  p_routine_day date,
  p_occurred_at timestamptz,
  p_idempotency_key uuid,
  p_source text
)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  current_user_id uuid;
begin
  current_user_id := (select auth.uid());

  if current_user_id is null then
    raise exception 'AUTHENTICATION_REQUIRED';
  end if;

  if p_idempotency_key is null then
    raise exception 'INVALID_IDEMPOTENCY_KEY';
  end if;

  perform private.assert_check_in_is_valid(
    current_user_id,
    p_routine_item_id,
    p_routine_day,
    p_occurred_at,
    p_source
  );
  perform set_config('app.check_in_mutation', 'allowed', true);

  delete from public.check_ins
  where user_id = current_user_id
    and routine_item_id = p_routine_item_id
    and routine_day = p_routine_day;
end;
$$;

revoke all on function public.undo_check_in(uuid, date, timestamptz, uuid, text)
  from public, anon;
grant execute on function public.undo_check_in(uuid, date, timestamptz, uuid, text)
  to authenticated;
