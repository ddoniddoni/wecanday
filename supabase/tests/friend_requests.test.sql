begin;

create extension if not exists pgtap with schema extensions;

select plan(24);

select has_table('public', 'friendships', 'friendships table exists');
select ok(
  (select relrowsecurity from pg_class where oid = 'public.friendships'::regclass),
  'friendships has RLS enabled'
);
select policies_are(
  'public',
  'friendships',
  array['users can read their own friendships'],
  'friendships has an own-row read policy only'
);
select ok(
  has_table_privilege('authenticated', 'public.friendships', 'select'),
  'authenticated users can read their own friendship metadata'
);
select ok(
  not has_table_privilege('authenticated', 'public.friendships', 'update'),
  'clients cannot directly update friendship status'
);
select has_function('public', 'create_friend_request', array['uuid'], 'create request RPC exists');
select has_function('public', 'respond_to_friend_request', array['uuid', 'text'], 'respond request RPC exists');
select has_function('public', 'cancel_friend_request', array['uuid'], 'cancel request RPC exists');
select has_function('public', 'list_pending_friend_requests', array[]::text[], 'list pending requests RPC exists');
select ok(
  not has_function_privilege('anon', 'public.create_friend_request(uuid)', 'execute'),
  'anonymous callers cannot create friend requests'
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
    '60000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'friend-request-a@example.invalid',
    '',
    '{"provider":"google","providers":["google"]}'::jsonb,
    '{"full_name":"Friend A"}'::jsonb,
    now(),
    now()
  ),
  (
    '60000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'friend-request-b@example.invalid',
    '',
    '{"provider":"google","providers":["google"]}'::jsonb,
    '{"full_name":"Friend B"}'::jsonb,
    now(),
    now()
  ),
  (
    '60000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'friend-request-c@example.invalid',
    '',
    '{"provider":"google","providers":["google"]}'::jsonb,
    '{"full_name":"Friend C"}'::jsonb,
    now(),
    now()
  );

set local role authenticated;
select set_config('request.jwt.claim.sub', '60000000-0000-0000-0000-000000000001', true);

select is(
  (public.create_friend_request('60000000-0000-0000-0000-000000000002')).status,
  'pending',
  'a user can create a pending friend request'
);
select is(
  (select count(*)::integer from public.friendships),
  1,
  'the first request creates one relationship row'
);
select is(
  (public.create_friend_request('60000000-0000-0000-0000-000000000002')).status,
  'pending',
  'repeating the same request returns the existing pending relationship'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', '60000000-0000-0000-0000-000000000002', true);
select is(
  (select display_name from public.list_pending_friend_requests()),
  'Friend A',
  'the recipient sees only the requester minimal profile in the pending list'
);
select is(
  (public.create_friend_request('60000000-0000-0000-0000-000000000001')).status,
  'accepted',
  'a reciprocal request automatically accepts the existing pending relationship'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', '60000000-0000-0000-0000-000000000001', true);
select is(
  (select status from public.friendships),
  'accepted',
  'the requester can read the accepted status through own-row RLS'
);
select is(
  (select count(*)::integer from public.friendships where user_low_id = '60000000-0000-0000-0000-000000000001' and user_high_id = '60000000-0000-0000-0000-000000000002'),
  1,
  'canonical pair uniqueness leaves only one relationship row'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', '60000000-0000-0000-0000-000000000002', true);
select is(
  (public.create_friend_request('60000000-0000-0000-0000-000000000003')).status,
  'pending',
  'a second pair can create a request'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', '60000000-0000-0000-0000-000000000003', true);
select is(
  (public.respond_to_friend_request(
    (select id from public.friendships where requester_id = '60000000-0000-0000-0000-000000000002'),
    'declined'
  )).status,
  'declined',
  'the recipient can decline a pending request'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', '60000000-0000-0000-0000-000000000002', true);
select is(
  (public.create_friend_request('60000000-0000-0000-0000-000000000003')).status,
  'pending',
  'a declined request can be sent again without duplicating the pair'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', '60000000-0000-0000-0000-000000000003', true);
select is(
  (public.respond_to_friend_request(
    (select id from public.friendships where requester_id = '60000000-0000-0000-0000-000000000002'),
    'accepted'
  )).status,
  'accepted',
  'the recipient can accept a re-sent pending request'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', '60000000-0000-0000-0000-000000000001', true);
select is(
  (public.create_friend_request('60000000-0000-0000-0000-000000000003')).status,
  'pending',
  'a user can create another pending request'
);
select lives_ok(
  $$select public.cancel_friend_request((select id from public.friendships where requester_id = '60000000-0000-0000-0000-000000000001' and addressee_id = '60000000-0000-0000-0000-000000000003'))$$,
  'the requester can cancel their pending request'
);
reset role;

insert into public.user_blocks (blocker_id, blocked_id)
values (
  '60000000-0000-0000-0000-000000000002',
  '60000000-0000-0000-0000-000000000001'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '60000000-0000-0000-0000-000000000001', true);
select throws_ok(
  $$select public.create_friend_request('60000000-0000-0000-0000-000000000002')$$,
  'USER_BLOCKED',
  'a blocked user cannot create a request'
);
reset role;

select * from finish();
rollback;
