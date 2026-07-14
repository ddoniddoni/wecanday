begin;

create extension if not exists pgtap with schema extensions;

select plan(18);

select has_table('public', 'device_push_tokens', 'device push tokens table exists');
select ok(
  (select relrowsecurity from pg_class where oid = 'public.device_push_tokens'::regclass),
  'device push tokens has RLS enabled'
);
select ok(
  not has_table_privilege('authenticated', 'public.device_push_tokens', 'select'),
  'authenticated users cannot directly read push tokens'
);
select ok(
  not has_table_privilege('authenticated', 'public.device_push_tokens', 'insert'),
  'authenticated users cannot directly write push tokens'
);
select has_function('public', 'upsert_device_push_token', array['text', 'text', 'text', 'text'], 'push token upsert RPC exists');
select has_function('public', 'disable_current_device_push_token', array['text', 'text'], 'push token disable RPC exists');
select ok(
  not has_function_privilege('anon', 'public.upsert_device_push_token(text, text, text, text)', 'execute'),
  'anonymous callers cannot register push tokens'
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
    '90000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'push-a@example.invalid',
    '',
    '{}'::jsonb,
    '{"full_name":"Push A"}'::jsonb,
    now(),
    now()
  ),
  (
    '90000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'push-b@example.invalid',
    '',
    '{}'::jsonb,
    '{"full_name":"Push B"}'::jsonb,
    now(),
    now()
  );

set local role authenticated;
select set_config('request.jwt.claim.sub', '90000000-0000-0000-0000-000000000001', true);

select is(
  (public.upsert_device_push_token(
    'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    'ExponentPushToken[push-token-a]',
    'ko',
    'android'
  )).enabled,
  true,
  'a user can register their current Android push token'
);
reset role;

select is(
  (select user_id from public.device_push_tokens where expo_push_token = 'ExponentPushToken[push-token-a]'),
  '90000000-0000-0000-0000-000000000001'::uuid,
  'the registered token belongs to its caller'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '90000000-0000-0000-0000-000000000001', true);
select is(
  (public.upsert_device_push_token(
    'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    'ExponentPushToken[push-token-a-rotated]',
    'en',
    'android'
  )).locale,
  'en',
  'a refreshed token replaces the prior device registration'
);
reset role;

select is(
  (select count(*)::integer from public.device_push_tokens),
  1,
  'one device has one active registration after token refresh'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '90000000-0000-0000-0000-000000000002', true);
select is(
  (public.upsert_device_push_token(
    'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
    'ExponentPushToken[push-token-b]',
    'ko',
    'android'
  )).user_id,
  '90000000-0000-0000-0000-000000000002'::uuid,
  'a shared device registration moves to the newly signed-in user'
);
reset role;

select is(
  (select count(*)::integer from public.device_push_tokens),
  1,
  'the prior shared-device registration is removed'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '90000000-0000-0000-0000-000000000001', true);
select lives_ok(
  $$select public.disable_current_device_push_token('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', 'android')$$,
  'a former user cannot disable another user token'
);
reset role;

select ok(
  (select enabled from public.device_push_tokens where expo_push_token = 'ExponentPushToken[push-token-b]'),
  'a former user cannot change the current registration'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '90000000-0000-0000-0000-000000000002', true);
select lives_ok(
  $$select public.disable_current_device_push_token('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', 'android')$$,
  'the owner can disable their current device token at logout'
);
reset role;

select ok(
  not (select enabled from public.device_push_tokens where expo_push_token = 'ExponentPushToken[push-token-b]'),
  'logout disables the current device registration'
);

select set_config('request.jwt.claim.sub', '', true);
select throws_ok(
  $$select public.upsert_device_push_token('bad', 'ExponentPushToken[bad]', 'ko', 'android')$$,
  'AUTH_REQUIRED',
  'unauthenticated callers cannot register a token'
);

select * from finish();
rollback;
