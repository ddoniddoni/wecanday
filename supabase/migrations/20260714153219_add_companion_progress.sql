create function public.get_companion_progress()
returns table (
  experience integer,
  level integer,
  experience_in_level integer,
  experience_to_next_level integer
)
language sql
stable
security invoker
set search_path = ''
as $$
  with earned_experience as (
    select (count(*) * 10)::integer as total_experience
    from public.check_ins
    where user_id = (select auth.uid())
  )
  select
    total_experience,
    (total_experience / 50) + 1,
    total_experience % 50,
    50
  from earned_experience;
$$;

revoke all on function public.get_companion_progress()
  from public, anon;
grant execute on function public.get_companion_progress()
  to authenticated;
