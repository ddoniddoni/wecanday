create table public.routine_item_status_events (
  id uuid primary key default gen_random_uuid(),
  routine_item_id uuid not null references public.routine_items(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  status text not null check (status in ('active', 'paused', 'completed', 'archived')),
  effective_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index routine_item_status_events_routine_item_id_effective_at_idx
  on public.routine_item_status_events(routine_item_id, effective_at desc);

alter table public.routine_item_status_events enable row level security;

revoke all on table public.routine_item_status_events from public, anon, authenticated;
grant select on table public.routine_item_status_events to authenticated;

create policy "users can read their own routine item status events"
on public.routine_item_status_events
for select
to authenticated
using ((select auth.uid()) = user_id);

insert into public.routine_item_status_events (
  routine_item_id,
  user_id,
  status,
  effective_at
)
select id, user_id, status, now()
from public.routine_items;

create function private.record_routine_item_status_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.routine_item_status_events (
    routine_item_id,
    user_id,
    status
  )
  values (new.id, new.user_id, new.status);

  return new;
end;
$$;

revoke all on function private.record_routine_item_status_change()
  from public, anon, authenticated;

create trigger record_routine_item_status_change
after update of status on public.routine_items
for each row
when (old.status is distinct from new.status)
execute function private.record_routine_item_status_change();
