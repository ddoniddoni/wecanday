begin;

create extension if not exists pgtap with schema extensions;

select plan(13);

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
    '50000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'friend-searcher@example.invalid',
    '',
    '{"provider":"google","providers":["google"]}'::jsonb,
    '{"full_name":"Searcher"}'::jsonb,
    now(),
    now()
  ),
  (
    '50000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'friend-target@example.invalid',
    '',
    '{"provider":"google","providers":["google"]}'::jsonb,
    '{"full_name":"Target"}'::jsonb,
    now(),
    now()
  ),
  (
    '50000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'friend-rate-limit@example.invalid',
    '',
    '{"provider":"google","providers":["google"]}'::jsonb,
    '{"full_name":"Rate limit"}'::jsonb,
    now(),
    now()
  );

update public.profiles
set public_code = case id
  when '50000000-0000-0000-0000-000000000001'::uuid then 'SearchAbc123'
  when '50000000-0000-0000-0000-000000000002'::uuid then 'TargetXyZ456'
  when '50000000-0000-0000-0000-000000000003'::uuid then 'RateLimit789'
  else public_code
end
where id in (
  '50000000-0000-0000-0000-000000000001'::uuid,
  '50000000-0000-0000-0000-000000000002'::uuid,
  '50000000-0000-0000-0000-000000000003'::uuid
);

select has_function(
  'public',
  'lookup_profile_by_public_code',
  array['text'],
  'exact-code lookup RPC exists'
);
select ok(
  not has_function_privilege('anon', 'public.lookup_profile_by_public_code(text)', 'EXECUTE'),
  'anonymous callers cannot execute the lookup RPC'
);
select ok(
  has_function_privilege('authenticated', 'public.lookup_profile_by_public_code(text)', 'EXECUTE'),
  'authenticated callers can execute the lookup RPC'
);
select ok(
  (select relrowsecurity from pg_class where oid = 'public.user_blocks'::regclass),
  'user blocks has RLS enabled'
);
select is(
  (select count(*)::integer from information_schema.role_table_grants where table_schema = 'public' and table_name = 'user_blocks' and grantee = 'authenticated'),
  0,
  'clients have no direct user block table privileges'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '50000000-0000-0000-0000-000000000001', true);

select is_empty(
  $$select * from public.profiles where id = '50000000-0000-0000-0000-000000000002'$$,
  'a client cannot directly read another profile'
);
select is(
  (select display_name from public.lookup_profile_by_public_code('TargetXyZ456')),
  'Target',
  'the RPC returns the matching minimal profile'
);
select is_empty(
  $$select * from public.lookup_profile_by_public_code('SearchAbc123')$$,
  'the RPC excludes the caller profile'
);
select is_empty(
  $$select * from public.lookup_profile_by_public_code('not-a-code')$$,
  'the RPC refuses malformed codes without a profile result'
);
reset role;

insert into public.user_blocks (blocker_id, blocked_id)
values (
  '50000000-0000-0000-0000-000000000001',
  '50000000-0000-0000-0000-000000000002'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '50000000-0000-0000-0000-000000000001', true);
select is_empty(
  $$select * from public.lookup_profile_by_public_code('TargetXyZ456')$$,
  'the RPC excludes blocked profiles'
);
select set_config('request.jwt.claim.sub', '50000000-0000-0000-0000-000000000002', true);
select is_empty(
  $$select * from public.lookup_profile_by_public_code('SearchAbc123')$$,
  'the RPC also excludes a profile that has blocked the caller'
);
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub', '50000000-0000-0000-0000-000000000003', true);
select lives_ok(
  $$
    select count(*)
    from generate_series(1, 10) as attempt(number)
    cross join lateral public.lookup_profile_by_public_code(
      'Ab7kL2xP' || lpad(attempt.number::text, 4, '0')
    )
  $$,
  'ten valid exact-code attempts are allowed in one minute'
);
select throws_ok(
  $$select * from public.lookup_profile_by_public_code('Ab7kL2xP9999')$$,
  'FRIEND_CODE_RATE_LIMITED',
  'the eleventh valid exact-code attempt is rate limited'
);
reset role;

select * from finish();
rollback;
