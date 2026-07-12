create function public.add_routine_item(
  p_plan_id uuid,
  p_routine_title text,
  p_schedule_weekdays smallint[]
)
returns public.routine_items
language plpgsql
security invoker
set search_path = ''
as $$
declare
  selected_plan public.plans;
  created_routine public.routine_items;
begin
  if (select auth.uid()) is null then
    raise exception 'AUTHENTICATION_REQUIRED';
  end if;

  select *
  into selected_plan
  from public.plans
  where id = p_plan_id
    and user_id = (select auth.uid());

  if not found then
    raise exception 'PLAN_NOT_FOUND';
  end if;

  if char_length(trim(coalesce(p_routine_title, ''))) not between 1 and 80 then
    raise exception 'INVALID_PLAN_INPUT';
  end if;

  if cardinality(p_schedule_weekdays) not between 1 and 7
    or exists (
      select 1
      from unnest(p_schedule_weekdays) as weekday(value)
      where weekday.value not between 0 and 6
    )
    or cardinality(p_schedule_weekdays) <> (
      select count(distinct weekday.value)
      from unnest(p_schedule_weekdays) as weekday(value)
    ) then
    raise exception 'INVALID_ROUTINE_SCHEDULE';
  end if;

  insert into public.routine_items (
    plan_id,
    user_id,
    title,
    schedule_weekdays,
    starts_on,
    ends_on
  )
  values (
    selected_plan.id,
    (select auth.uid()),
    trim(p_routine_title),
    p_schedule_weekdays,
    selected_plan.starts_on,
    selected_plan.ends_on
  )
  returning * into created_routine;

  return created_routine;
end;
$$;

revoke all on function public.add_routine_item(uuid, text, smallint[])
  from public, anon;
grant execute on function public.add_routine_item(uuid, text, smallint[])
  to authenticated;
