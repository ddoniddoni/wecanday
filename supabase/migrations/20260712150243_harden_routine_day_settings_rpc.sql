grant update (time_zone, day_start_minute, routine_day_settings_completed_at)
  on table public.profiles to authenticated;

create function private.prevent_direct_initial_routine_day_settings_update()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if (
    new.time_zone is distinct from old.time_zone
    or new.day_start_minute is distinct from old.day_start_minute
    or new.routine_day_settings_completed_at is distinct from old.routine_day_settings_completed_at
  ) and coalesce(
    current_setting('app.routine_day_settings_update', true),
    ''
  ) <> 'allowed' then
    raise exception 'ROUTINE_DAY_SETTINGS_MUST_USE_RPC';
  end if;

  return new;
end;
$$;

revoke all on function private.prevent_direct_initial_routine_day_settings_update()
  from public, anon, authenticated;

create trigger prevent_direct_initial_routine_day_settings_update
before update on public.profiles
for each row
execute function private.prevent_direct_initial_routine_day_settings_update();

create or replace function public.complete_initial_routine_day_settings(
  p_time_zone text,
  p_day_start_minute smallint
)
returns public.profiles
language plpgsql
security invoker
set search_path = ''
as $$
declare
  updated_profile public.profiles;
begin
  if (select auth.uid()) is null then
    raise exception 'AUTHENTICATION_REQUIRED';
  end if;

  if p_day_start_minute is null or p_day_start_minute not between 0 and 1439 then
    raise exception 'INVALID_ROUTINE_DAY_START';
  end if;

  if not exists (
    select 1
    from pg_catalog.pg_timezone_names
    where name = p_time_zone
  ) then
    raise exception 'INVALID_TIME_ZONE';
  end if;

  perform set_config('app.routine_day_settings_update', 'allowed', true);

  update public.profiles
  set
    time_zone = p_time_zone,
    day_start_minute = p_day_start_minute,
    routine_day_settings_completed_at = now()
  where id = (select auth.uid())
    and routine_day_settings_completed_at is null
  returning * into updated_profile;

  if updated_profile is null then
    raise exception 'ROUTINE_DAY_SETTINGS_ALREADY_COMPLETED';
  end if;

  return updated_profile;
end;
$$;
