update public.profiles
set theme_id = 'light'
where theme_id not in ('system', 'light', 'dark');

alter table public.profiles
  drop constraint if exists profiles_companion_id_check,
  drop constraint if exists profiles_theme_id_check,
  add constraint profiles_companion_id_check check (
    companion_id is null
    or companion_id in ('sprout', 'dew', 'ember', 'luna')
  ),
  add constraint profiles_theme_id_check check (
    theme_id in ('system', 'light', 'dark')
  );
