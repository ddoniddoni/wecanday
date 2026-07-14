alter table public.profiles
  add column reduce_motion boolean not null default false;

grant update (reduce_motion) on table public.profiles to authenticated;
