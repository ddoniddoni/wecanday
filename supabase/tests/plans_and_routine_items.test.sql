begin;

create extension if not exists pgtap with schema extensions;

select plan(34);

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
select has_table(
  'public',
  'routine_item_status_events',
  'routine item status events table exists'
);
select ok(
  (select relrowsecurity from pg_class where oid = 'public.routine_item_status_events'::regclass),
  'routine item status events has RLS enabled'
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
  '30000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'routine-add-test@example.invalid',
  '',
  '{"provider":"google","providers":["google"]}'::jsonb,
  '{"full_name":"Routine Add Test"}'::jsonb,
  now(),
  now()
);

select set_config(
  'request.jwt.claim.sub',
  '30000000-0000-0000-0000-000000000002',
  true
);

select lives_ok(
  $$select public.create_plan_with_routine('Plan with two routines', 'Routine 1', array[1]::smallint[], current_date)$$,
  'a plan for adding a second routine can be created'
);
select lives_ok(
  $$select public.add_routine_item(
    (select id from public.plans where user_id = '30000000-0000-0000-0000-000000000002'),
    'Routine 2',
    array[2]::smallint[]
  )$$,
  'an additional routine can be added to an owned plan'
);
select results_eq(
  $$select count(*)::integer from public.routine_items where user_id = '30000000-0000-0000-0000-000000000002'$$,
  array[2],
  'the added routine belongs to the selected plan owner'
);
select lives_ok(
  $$select public.add_routine_item(
    (select id from public.plans where user_id = '30000000-0000-0000-0000-000000000002'),
    'Routine 3',
    array[3]::smallint[]
  )$$,
  'a third active routine can be added to the same plan'
);
select lives_ok(
  $$select public.add_routine_item(
    (select id from public.plans where user_id = '30000000-0000-0000-0000-000000000002'),
    'Routine 4',
    array[4]::smallint[]
  )$$,
  'a fourth active routine can be added to the same plan'
);
select throws_ok(
  $$select public.add_routine_item(
    (select id from public.plans where user_id = '30000000-0000-0000-0000-000000000002'),
    'Routine 5',
    array[5]::smallint[]
  )$$,
  'ROUTINE_LIMIT_REACHED',
  'the server rejects a fifth active routine added to a plan'
);
select throws_ok(
  $$select public.add_routine_item('00000000-0000-0000-0000-000000000000', 'Missing plan', array[1]::smallint[])$$,
  'PLAN_NOT_FOUND',
  'a routine cannot be added to a plan that is not owned by the caller'
);
select lives_ok(
  $$select public.update_routine_item(
    (select id from public.routine_items where user_id = '30000000-0000-0000-0000-000000000002' and title = 'Routine 1'),
    'Updated routine',
    array[0, 6]::smallint[]
  )$$,
  'a routine owner can update its title and scheduled weekdays'
);
select is(
  (
    select title
    from public.routine_items
    where user_id = '30000000-0000-0000-0000-000000000002'
      and schedule_weekdays = array[0, 6]::smallint[]
  ),
  'Updated routine',
  'the updated title and weekdays are stored'
);
select lives_ok(
  $$select public.update_routine_item(
    (select id from public.routine_items where user_id = '30000000-0000-0000-0000-000000000002' and title = 'Updated routine'),
    'Updated routine',
    array[0, 6]::smallint[],
    570
  )$$,
  'a routine owner can save a reminder minute'
);
select is(
  (select reminder_minute from public.routine_items where user_id = '30000000-0000-0000-0000-000000000002' and title = 'Updated routine'),
  570::smallint,
  'the routine reminder minute is stored'
);
select set_config(
  'test.routine_item_id',
  (
    select id::text
    from public.routine_items
    where user_id = '30000000-0000-0000-0000-000000000002'
      and title = 'Updated routine'
  ),
  true
);
select set_config(
  'request.jwt.claim.sub',
  '30000000-0000-0000-0000-000000000001',
  true
);
select throws_ok(
  $$select public.update_routine_item(
    current_setting('test.routine_item_id')::uuid,
    'Another update',
    array[1]::smallint[]
  )$$,
  'ROUTINE_NOT_FOUND',
  'another user cannot update a routine item'
);
select set_config(
  'request.jwt.claim.sub',
  '30000000-0000-0000-0000-000000000002',
  true
);
select throws_ok(
  $$select public.update_routine_item(
    (select id from public.routine_items where user_id = '30000000-0000-0000-0000-000000000002' limit 1),
    'Invalid schedule',
    array[]::smallint[]
  )$$,
  'INVALID_ROUTINE_SCHEDULE',
  'an empty schedule is rejected when updating a routine item'
);
select lives_ok(
  $$select public.set_routine_item_status(
    current_setting('test.routine_item_id')::uuid,
    'paused'
  )$$,
  'a routine owner can pause an active routine'
);
select is(
  (
    select status
    from public.routine_items
    where id = current_setting('test.routine_item_id')::uuid
  ),
  'paused',
  'a paused routine is no longer active'
);
select is(
  (
    select status
    from public.routine_item_status_events
    where routine_item_id = current_setting('test.routine_item_id')::uuid
    order by effective_at desc
    limit 1
  ),
  'paused',
  'pausing a routine records a status event for future streak calculations'
);
select lives_ok(
  $$select public.add_routine_item(
    (select id from public.plans where user_id = '30000000-0000-0000-0000-000000000002'),
    'Routine 5 after pause',
    array[5]::smallint[]
  )$$,
  'pausing a routine frees one active routine slot'
);
select throws_ok(
  $$select public.set_routine_item_status(
    current_setting('test.routine_item_id')::uuid,
    'active'
  )$$,
  'ROUTINE_LIMIT_REACHED',
  'resuming a paused routine is rejected at the active routine limit'
);
select lives_ok(
  $$select public.archive_routine_item(
    (select id from public.routine_items where user_id = '30000000-0000-0000-0000-000000000002' and title = 'Routine 5 after pause')
  )$$,
  'a routine owner can archive a routine item'
);
select is(
  (
    select status
    from public.routine_items
    where user_id = '30000000-0000-0000-0000-000000000002'
      and title = 'Routine 5 after pause'
  ),
  'archived',
  'archiving a routine retains the row with archived status'
);
select lives_ok(
  $$select public.archive_plan(
    (select id from public.plans where user_id = '30000000-0000-0000-0000-000000000002')
  )$$,
  'a plan owner can archive a plan'
);
select results_eq(
  $$select count(*)::integer from public.routine_items where user_id = '30000000-0000-0000-0000-000000000002' and status = 'active'$$,
  array[0],
  'archiving a plan archives its remaining active routine items'
);

reset role;
select * from finish();
rollback;
