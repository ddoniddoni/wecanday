alter table public.profiles
  add column time_zone text,
  add column day_start_minute smallint,
  add column routine_day_settings_completed_at timestamptz,
  add constraint profiles_day_start_minute_range check (
    day_start_minute is null
    or day_start_minute between 0 and 1439
  );

create function public.complete_initial_routine_day_settings(
  p_time_zone text,
  p_day_start_minute smallint
)
returns public.profiles
language plpgsql
security definer
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

revoke all on function public.complete_initial_routine_day_settings(text, smallint)
  from public, anon;
grant execute on function public.complete_initial_routine_day_settings(text, smallint)
  to authenticated;
