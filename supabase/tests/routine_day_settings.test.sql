begin;

create extension if not exists pgtap with schema extensions;

select plan(8);

select has_column('public', 'profiles', 'time_zone', 'profiles stores the IANA time zone');
select has_column('public', 'profiles', 'day_start_minute', 'profiles stores the day start minute');
select has_column(
  'public',
  'profiles',
  'routine_day_settings_completed_at',
  'profiles records initial routine-day setup completion'
);
select has_function(
  'public',
  'complete_initial_routine_day_settings',
  array['text', 'smallint'],
  'authenticated users save initial settings through a validated RPC'
);
select ok(
  has_column_privilege('authenticated', 'public.profiles', 'time_zone', 'UPDATE'),
  'the RPC has the minimum column permission required to update time_zone'
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
  '20000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'routine-day-test@example.invalid',
  '',
  '{"provider":"google","providers":["google"]}'::jsonb,
  '{"full_name":"Routine Day Test"}'::jsonb,
  now(),
  now()
);

set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '20000000-0000-0000-0000-000000000001',
  true
);

select is(
  (public.complete_initial_routine_day_settings('Asia/Seoul', 240)).time_zone,
  'Asia/Seoul',
  'the authenticated user can store a validated time zone'
);
select throws_ok(
  $$select public.complete_initial_routine_day_settings('Asia/Seoul', 240)$$,
  'ROUTINE_DAY_SETTINGS_ALREADY_COMPLETED',
  'initial settings cannot be overwritten after completion'
);

select set_config('app.routine_day_settings_update', '', true);
select throws_ok(
  $$
    update public.profiles
    set time_zone = 'America/New_York'
    where id = '20000000-0000-0000-0000-000000000001'
  $$,
  'ROUTINE_DAY_SETTINGS_MUST_USE_RPC',
  'clients cannot update routine-day settings outside the RPC'
);

reset role;
select * from finish();
rollback;
