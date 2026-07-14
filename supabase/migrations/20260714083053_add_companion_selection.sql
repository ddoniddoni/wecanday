alter table public.profiles
  add column companion_id text check (
    companion_id is null
    or companion_id in ('sprout', 'dew', 'ember')
  );

grant update (companion_id) on table public.profiles to authenticated;
