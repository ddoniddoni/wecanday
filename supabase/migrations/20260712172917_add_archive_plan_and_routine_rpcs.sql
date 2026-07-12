create function public.archive_routine_item(p_routine_item_id uuid)
returns public.routine_items
language plpgsql
security invoker
set search_path = ''
as $$
declare
  archived_routine public.routine_items;
begin
  if (select auth.uid()) is null then
    raise exception 'AUTHENTICATION_REQUIRED';
  end if;

  update public.routine_items
  set status = 'archived'
  where id = p_routine_item_id
    and user_id = (select auth.uid())
    and status <> 'archived'
  returning * into archived_routine;

  if not found then
    raise exception 'ROUTINE_NOT_FOUND';
  end if;

  return archived_routine;
end;
$$;

revoke all on function public.archive_routine_item(uuid) from public, anon;
grant execute on function public.archive_routine_item(uuid) to authenticated;

create function public.archive_plan(p_plan_id uuid)
returns public.plans
language plpgsql
security invoker
set search_path = ''
as $$
declare
  archived_plan public.plans;
begin
  if (select auth.uid()) is null then
    raise exception 'AUTHENTICATION_REQUIRED';
  end if;

  update public.plans
  set status = 'archived'
  where id = p_plan_id
    and user_id = (select auth.uid())
    and status <> 'archived'
  returning * into archived_plan;

  if not found then
    raise exception 'PLAN_NOT_FOUND';
  end if;

  update public.routine_items
  set status = 'archived'
  where plan_id = archived_plan.id
    and user_id = (select auth.uid())
    and status <> 'archived';

  return archived_plan;
end;
$$;

revoke all on function public.archive_plan(uuid) from public, anon;
grant execute on function public.archive_plan(uuid) to authenticated;
