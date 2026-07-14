begin;

create extension if not exists pgtap with schema extensions;

select plan(3);

select has_column(
  'public',
  'profiles',
  'haptics_enabled',
  'profiles stores the haptics preference'
);
select ok(
  has_column_privilege('authenticated', 'public.profiles', 'haptics_enabled', 'UPDATE'),
  'authenticated users can update their haptics preference'
);
select is(
  (
    select column_default
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'haptics_enabled'
  ),
  'true',
  'haptics are enabled by default'
);

select * from finish();
rollback;
