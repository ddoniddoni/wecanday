begin;

create extension if not exists pgtap with schema extensions;

select plan(3);

select has_column('public', 'profiles', 'companion_id', 'profiles stores the selected companion');
select ok(
  has_column_privilege('authenticated', 'public.profiles', 'companion_id', 'UPDATE'),
  'authenticated users can update only their companion preference'
);
select ok(
  exists (
    select 1
    from pg_catalog.pg_constraint
    where conname = 'profiles_companion_id_check'
      and pg_get_constraintdef(oid) like '%sprout%dew%ember%'
  ),
  'the database restricts companion IDs to the supported set'
);

select * from finish();
rollback;
