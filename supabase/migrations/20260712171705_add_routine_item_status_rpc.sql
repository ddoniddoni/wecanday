create function public.set_routine_item_status(
  p_routine_item_id uuid,
  p_status text
)
returns public.routine_items
language plpgsql
security invoker
set search_path = ''
as $$
declare
  updated_routine public.routine_items;
begin
  if (select auth.uid()) is null then
    raise exception 'AUTHENTICATION_REQUIRED';
  end if;

  if p_status not in ('active', 'paused') then
    raise exception 'INVALID_ROUTINE_STATUS';
  end if;

  update public.routine_items
  set status = p_status
  where id = p_routine_item_id
    and user_id = (select auth.uid())
  returning * into updated_routine;

  if not found then
    raise exception 'ROUTINE_NOT_FOUND';
  end if;

  return updated_routine;
end;
$$;

revoke all on function public.set_routine_item_status(uuid, text) from public, anon;
grant execute on function public.set_routine_item_status(uuid, text) to authenticated;
