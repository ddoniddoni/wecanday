begin;

create extension if not exists pgtap with schema extensions;

select plan(10);

select has_table('public', 'plans', 'plans table exists');
select has_table('public', 'routine_items', 'routine items table exists');
select ok(
  (select relrowsecurity from pg_class where oid = 'public.plans'::regclass),
  'plans has RLS enabled'
);
select ok(
  (select relrowsecurity from pg_class where oid = 'public.routine_items'::regclass),
  'routine items has RLS enabled'
);
select has_index(
  'public',
  'routine_items',
  'routine_items_active_user_id_idx',
  'active routine limit has an indexed lookup'
);

insert into auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  raw_app_meta_data,
  raw_user_meta_data,
  created_at,
  updated_at
)
values (
  '30000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'plans-test@example.invalid',
  '',
  '{"provider":"google","providers":["google"]}'::jsonb,
  '{"full_name":"Plans Test"}'::jsonb,
  now(),
  now()
);

set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '30000000-0000-0000-0000-000000000001',
  true
);

select lives_ok(
  $$select public.create_plan_with_routine('Plan 1', 'Routine 1', array[1]::smallint[], current_date)$$,
  'first active routine can be created'
);
select lives_ok(
  $$select public.create_plan_with_routine('Plan 2', 'Routine 2', array[1]::smallint[], current_date)$$,
  'second active routine can be created'
);
select lives_ok(
  $$select public.create_plan_with_routine('Plan 3', 'Routine 3', array[1]::smallint[], current_date)$$,
  'third active routine can be created'
);
select lives_ok(
  $$select public.create_plan_with_routine('Plan 4', 'Routine 4', array[1]::smallint[], current_date)$$,
  'fourth active routine can be created'
);
select throws_ok(
  $$select public.create_plan_with_routine('Plan 5', 'Routine 5', array[1]::smallint[], current_date)$$,
  'ROUTINE_LIMIT_REACHED',
  'fifth active routine is rejected by the server'
);

reset role;
select * from finish();
rollback;
