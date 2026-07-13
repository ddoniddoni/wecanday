begin;

create extension if not exists pgtap with schema extensions;

select plan(24);

select has_function('public', 'block_user', array['uuid'], 'block user RPC exists');
select has_function('public', 'unblock_user', array['uuid'], 'unblock user RPC exists');
select has_function('public', 'remove_friend', array['uuid'], 'remove friend RPC exists');
select has_function('public', 'list_friends', array[]::text[], 'list friends RPC exists');
select has_function('public', 'list_blocked_users', array[]::text[], 'list blocked users RPC exists');
select ok(
  not has_function_privilege('anon', 'public.block_user(uuid)', 'execute'),
  'anonymous callers cannot block users'
);
select ok(
  not has_table_privilege('authenticated', 'public.user_blocks', 'select'),
  'clients have no direct user block table access'
);
select ok(
  (select relrowsecurity from pg_class where oid = 'public.user_blocks'::regclass),
  'user blocks retains RLS'
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
    'friend-block-a@example.invalid',
    '',
    '{"provider":"google","providers":["google"]}'::jsonb,
    '{"full_name":"Friend A"}'::jsonb,
    now(),
    now()
  ),
  (
    '70000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'friend-block-b@example.invalid',
    '',
    '{"provider":"google","providers":["google"]}'::jsonb,
    '{"full_name":"Friend B"}'::jsonb,
    now(),
    now()
  ),
  (
    '70000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'friend-block-c@example.invalid',
    '',
    '{"provider":"google","providers":["google"]}'::jsonb,
    '{"full_name":"Friend C"}'::jsonb,
    now(),
    now()
  );

set local role authenticated;
select set_config('request.jwt.claim.sub', '70000000-0000-0000-0000-000000000001', true);
select is(
  (public.create_friend_request('70000000-0000-0000-0000-000000000002')).status,
  'pending',
  'a user can start a friend request before blocking'
);
select lives_ok(
  $$select public.block_user('70000000-0000-0000-0000-000000000002')$$,
  'a user can block another user'
);
select is(
  (select count(*)::integer from public.friendships),
  0,
  'blocking removes pending or accepted friendship relations atomically'
);
select is(
  (select display_name from public.list_blocked_users()),
  'Friend B',
  'the blocker sees only the blocked minimal profile'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', '70000000-0000-0000-0000-000000000002', true);
select throws_ok(
  $$select public.create_friend_request('70000000-0000-0000-0000-000000000001')$$,
  'USER_BLOCKED',
  'a blocked user cannot create a new request'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', '70000000-0000-0000-0000-000000000001', true);
select lives_ok(
  $$select public.unblock_user('70000000-0000-0000-0000-000000000002')$$,
  'the blocker can unblock the user'
);
select is(
  (public.create_friend_request('70000000-0000-0000-0000-000000000002')).status,
  'pending',
  'an unblocked pair can create a new request'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', '70000000-0000-0000-0000-000000000002', true);
select is(
  (public.respond_to_friend_request(
    (select id from public.friendships where requester_id = '70000000-0000-0000-0000-000000000001'),
    'accepted'
  )).status,
  'accepted',
  'the recipient can accept an unblocked request'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', '70000000-0000-0000-0000-000000000001', true);
select is(
  (select display_name from public.list_friends()),
  'Friend B',
  'an accepted minimal profile appears in the friend list'
);
select lives_ok(
  $$select public.remove_friend('70000000-0000-0000-0000-000000000002')$$,
  'a user can remove an accepted friend'
);
select is_empty(
  $$select * from public.list_friends()$$,
  'a removed friend no longer appears in the friend list'
);
select throws_ok(
  $$select public.block_user('70000000-0000-0000-0000-000000000001')$$,
  'CANNOT_BLOCK_SELF',
  'a user cannot block themselves'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', '70000000-0000-0000-0000-000000000002', true);
select is(
  (public.create_friend_request('70000000-0000-0000-0000-000000000003')).status,
  'pending',
  'another pair can create a pending request'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', '70000000-0000-0000-0000-000000000003', true);
select lives_ok(
  $$select public.block_user('70000000-0000-0000-0000-000000000002')$$,
  'the recipient can block a pending requester'
);
select is(
  (select count(*)::integer from public.friendships),
  0,
  'blocking also removes the incoming pending request'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', '70000000-0000-0000-0000-000000000002', true);
select throws_ok(
  $$select public.create_friend_request('70000000-0000-0000-0000-000000000003')$$,
  'USER_BLOCKED',
  'a blocked user cannot recreate a removed pending request'
);
reset role;

select * from finish();
rollback;
