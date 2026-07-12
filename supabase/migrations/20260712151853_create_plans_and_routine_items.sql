create table public.plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  title varchar(80) not null check (char_length(trim(title)) between 1 and 80),
  description varchar(500),
  starts_on date not null,
  ends_on date,
  status text not null default 'active' check (
    status in ('draft', 'active', 'paused', 'completed', 'archived')
  ),
  visibility text not null default 'private' check (
    visibility in ('private', 'friends_progress')
  ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_on is null or ends_on >= starts_on)
);

create table public.routine_items (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.plans(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  title varchar(80) not null check (char_length(trim(title)) between 1 and 80),
  schedule_weekdays smallint[] not null default array[0, 1, 2, 3, 4, 5, 6]::smallint[],
  status text not null default 'active' check (
    status in ('active', 'paused', 'completed', 'archived')
  ),
  sort_order integer not null default 0,
  starts_on date not null,
  ends_on date,
  reminder_minute smallint check (reminder_minute between 0 and 1439),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (cardinality(schedule_weekdays) between 1 and 7),
  check (schedule_weekdays <@ array[0, 1, 2, 3, 4, 5, 6]::smallint[]),
  check (ends_on is null or ends_on >= starts_on)
);

create index plans_user_id_status_idx on public.plans(user_id, status);
create index routine_items_plan_id_idx on public.routine_items(plan_id);
create index routine_items_active_user_id_idx
  on public.routine_items(user_id)
  where status = 'active';

alter table public.plans enable row level security;
alter table public.routine_items enable row level security;

revoke all on table public.plans from public, anon, authenticated;
revoke all on table public.routine_items from public, anon, authenticated;
grant select, insert, update, delete on table public.plans to authenticated;
grant select, insert, update, delete on table public.routine_items to authenticated;

create policy "users can manage their own plans"
on public.plans
for all
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "users can manage their own routine items"
on public.routine_items
for all
to authenticated
using ((select auth.uid()) = user_id)
with check (
  (select auth.uid()) = user_id
  and exists (
    select 1
    from public.plans
    where plans.id = routine_items.plan_id
      and plans.user_id = (select auth.uid())
  )
);

create function private.set_timestamp_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

revoke all on function private.set_timestamp_updated_at()
  from public, anon, authenticated;

create trigger set_plans_updated_at
before update on public.plans
for each row execute function private.set_timestamp_updated_at();

create trigger set_routine_items_updated_at
before update on public.routine_items
for each row execute function private.set_timestamp_updated_at();

create function private.enforce_active_routine_limit()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  active_routine_count integer;
begin
  if new.status <> 'active' then
    return new;
  end if;

  if tg_op = 'UPDATE' and old.status = 'active' and old.user_id = new.user_id then
    return new;
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(new.user_id::text, 0)
  );

  select count(*)::integer
  into active_routine_count
  from public.routine_items
  where user_id = new.user_id
    and status = 'active'
    and id is distinct from new.id;

  if active_routine_count >= 4 then
    raise exception 'ROUTINE_LIMIT_REACHED';
  end if;

  return new;
end;
$$;

revoke all on function private.enforce_active_routine_limit()
  from public, anon, authenticated;

create trigger enforce_active_routine_limit
before insert or update of status, user_id on public.routine_items
for each row execute function private.enforce_active_routine_limit();

create function public.create_plan_with_routine(
  p_plan_title text,
  p_routine_title text,
  p_schedule_weekdays smallint[],
  p_starts_on date
)
returns public.routine_items
language plpgsql
security invoker
set search_path = ''
as $$
declare
  created_plan public.plans;
  created_routine public.routine_items;
begin
  if (select auth.uid()) is null then
    raise exception 'AUTHENTICATION_REQUIRED';
  end if;

  if char_length(trim(coalesce(p_plan_title, ''))) not between 1 and 80
    or char_length(trim(coalesce(p_routine_title, ''))) not between 1 and 80 then
    raise exception 'INVALID_PLAN_INPUT';
  end if;

  if p_starts_on is null
    or cardinality(p_schedule_weekdays) not between 1 and 7
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

  insert into public.plans (user_id, title, starts_on)
  values ((select auth.uid()), trim(p_plan_title), p_starts_on)
  returning * into created_plan;

  insert into public.routine_items (
    plan_id,
    user_id,
    title,
    schedule_weekdays,
    starts_on
  )
  values (
    created_plan.id,
    (select auth.uid()),
    trim(p_routine_title),
    p_schedule_weekdays,
    p_starts_on
  )
  returning * into created_routine;

  return created_routine;
end;
$$;

revoke all on function public.create_plan_with_routine(text, text, smallint[], date)
  from public, anon;
grant execute on function public.create_plan_with_routine(text, text, smallint[], date)
  to authenticated;
