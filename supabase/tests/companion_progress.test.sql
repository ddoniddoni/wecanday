begin;

create extension if not exists pgtap with schema extensions;

select plan(8);

select has_function(
  'public',
  'get_companion_progress',
  array[]::text[],
  'companion progress function exists'
);
select ok(
  not has_function_privilege('anon', 'public.get_companion_progress()', 'EXECUTE'),
  'anonymous users cannot read companion progress'
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
values
  (
    '70000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'companion-progress-owner@example.invalid',
    '',
    '{"provider":"google","providers":["google"]}'::jsonb,
    '{"full_name":"Companion Progress Owner"}'::jsonb,
    now(),
    now()
  ),
  (
    '70000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'companion-progress-other@example.invalid',
    '',
    '{"provider":"google","providers":["google"]}'::jsonb,
    '{"full_name":"Companion Progress Other"}'::jsonb,
    now(),
    now()
  );

set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '70000000-0000-0000-0000-000000000001',
  true
);

select lives_ok(
  $$select public.complete_initial_routine_day_settings('UTC', 0::smallint)$$,
  'owner can configure a routine day'
);
select lives_ok(
  $$select public.create_plan_with_routine(
    'Companion progress plan',
    'Companion progress routine',
    array[extract(dow from (now() at time zone 'UTC')::date)::smallint],
    (now() at time zone 'UTC')::date
  )$$,
  'owner can create a routine for experience'
);
select lives_ok(
  $$select public.complete_check_in(
    (select id from public.routine_items where title = 'Companion progress routine'),
    (now() at time zone 'UTC')::date,
    now(),
    '70000000-0000-0000-0000-000000000011',
    'online'
  )$$,
  'owner earns experience through a completed routine'
);
select is(
  (select experience from public.get_companion_progress()),
  10,
  'one completed routine grants ten experience'
);
select is(
  (select level from public.get_companion_progress()),
  1,
  'ten experience remains at level one'
);

select set_config(
  'request.jwt.claim.sub',
  '70000000-0000-0000-0000-000000000002',
  true
);
select is(
  (select experience from public.get_companion_progress()),
  0,
  'another user cannot receive the owner experience'
);

reset role;
select * from finish();
rollback;
