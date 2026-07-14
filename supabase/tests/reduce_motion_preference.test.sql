begin;

create extension if not exists pgtap with schema extensions;

select plan(3);

select has_column(
  'public',
  'profiles',
  'reduce_motion',
  'profiles stores the reduce motion preference'
);
select ok(
  has_column_privilege('authenticated', 'public.profiles', 'reduce_motion', 'UPDATE'),
  'authenticated users can update their reduce motion preference'
);
select is(
  (
    select column_default
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'profiles'
      and column_name = 'reduce_motion'
  ),
  'false',
  'reduce motion is disabled by default'
);

select * from finish();
rollback;
