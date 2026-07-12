begin;

create extension if not exists pgtap with schema extensions;

select plan(14);

select has_table('public', 'check_ins', 'check ins table exists');
select ok(
  (select relrowsecurity from pg_class where oid = 'public.check_ins'::regclass),
  'check ins has RLS enabled'
);
select has_index(
  'public',
  'check_ins',
  'check_ins_user_id_routine_day_idx',
  'today check-in lookup has an index'
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
    '40000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'checkins-owner@example.invalid',
    '',
    '{"provider":"google","providers":["google"]}'::jsonb,
    '{"full_name":"Check-in Owner"}'::jsonb,
    now(),
    now()
  ),
  (
    '40000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'checkins-other@example.invalid',
    '',
    '{"provider":"google","providers":["google"]}'::jsonb,
    '{"full_name":"Check-in Other"}'::jsonb,
    now(),
    now()
  );

set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '40000000-0000-0000-0000-000000000001',
  true
);

select lives_ok(
  $$select public.complete_initial_routine_day_settings('UTC', 0::smallint)$$,
  'owner can configure a UTC routine day'
);
select lives_ok(
  $$select public.create_plan_with_routine(
    'Check-in plan',
    'Check-in routine',
    array[extract(dow from (now() at time zone 'UTC')::date)::smallint],
    (now() at time zone 'UTC')::date
  )$$,
  'owner can create a routine scheduled today'
);
select lives_ok(
  $$select public.complete_check_in(
    (select id from public.routine_items where title = 'Check-in routine'),
    (now() at time zone 'UTC')::date,
    now(),
    '40000000-0000-0000-0000-000000000011',
    'online'
  )$$,
  'owner can complete a scheduled routine'
);
select is(
  (select count(*)::integer from public.check_ins),
  1,
  'one completion row is created'
);
select lives_ok(
  $$select public.complete_check_in(
    (select id from public.routine_items where title = 'Check-in routine'),
    (now() at time zone 'UTC')::date,
    now(),
    '40000000-0000-0000-0000-000000000011',
    'online'
  )$$,
  'the same idempotency key is safe to retry'
);
select is(
  (select count(*)::integer from public.check_ins),
  1,
  'retry does not duplicate the completion'
);
select lives_ok(
  $$select public.complete_check_in(
    (select id from public.routine_items where title = 'Check-in routine'),
    (now() at time zone 'UTC')::date,
    now(),
    '40000000-0000-0000-0000-000000000012',
    'online'
  )$$,
  'a second request for the same routine day returns the existing completion'
);
select is(
  (select count(*)::integer from public.check_ins),
  1,
  'routine-day uniqueness prevents duplicate rows'
);

select set_config(
  'request.jwt.claim.sub',
  '40000000-0000-0000-0000-000000000002',
  true
);
select is_empty(
  $$select * from public.check_ins$$,
  'another user cannot read the owner check in'
);

select set_config(
  'request.jwt.claim.sub',
  '40000000-0000-0000-0000-000000000001',
  true
);
select lives_ok(
  $$select public.undo_check_in(
    (select id from public.routine_items where title = 'Check-in routine'),
    (now() at time zone 'UTC')::date,
    now(),
    '40000000-0000-0000-0000-000000000013',
    'online'
  )$$,
  'owner can undo a check in during the routine day'
);
select is(
  (select count(*)::integer from public.check_ins),
  0,
  'undo removes the current completion'
);

reset role;
select * from finish(true);
rollback;
