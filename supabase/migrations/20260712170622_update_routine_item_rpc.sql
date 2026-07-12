create function public.update_routine_item(
  p_routine_item_id uuid,
  p_routine_title text,
  p_schedule_weekdays smallint[]
)
returns public.routine_items
language plpgsql
security invoker
set search_path = ''
as $$
declare
  updated_routine public.routine_items;
begin
  if (select auth.uid()) is null then raise exception 'AUTHENTICATION_REQUIRED'; end if;
  if char_length(trim(coalesce(p_routine_title, ''))) not between 1 and 80 then raise exception 'INVALID_PLAN_INPUT'; end if;
  if coalesce(cardinality(p_schedule_weekdays), 0) not between 1 and 7
    or exists (select 1 from unnest(p_schedule_weekdays) as weekday(value) where weekday.value not between 0 and 6)
    or coalesce(cardinality(p_schedule_weekdays), 0) <> (select count(distinct weekday.value) from unnest(p_schedule_weekdays) as weekday(value)) then
    raise exception 'INVALID_ROUTINE_SCHEDULE';
  end if;
  update public.routine_items
  set title = trim(p_routine_title), schedule_weekdays = p_schedule_weekdays
  where id = p_routine_item_id and user_id = (select auth.uid())
  returning * into updated_routine;
  if not found then raise exception 'ROUTINE_NOT_FOUND'; end if;
  return updated_routine;
end;
$$;
revoke all on function public.update_routine_item(uuid, text, smallint[]) from public, anon;
grant execute on function public.update_routine_item(uuid, text, smallint[]) to authenticated;
