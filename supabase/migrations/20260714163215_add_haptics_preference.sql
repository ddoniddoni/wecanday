alter table public.profiles
  add column haptics_enabled boolean not null default true;

grant update (haptics_enabled) on table public.profiles to authenticated;
