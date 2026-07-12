begin;

create extension if not exists pgtap with schema extensions;

select plan(15);

select has_table('public', 'profiles', 'profiles table exists');
select col_is_pk('public', 'profiles', 'id', 'profiles.id is the primary key');
select has_column('public', 'profiles', 'public_code', 'public code exists');
select col_not_null('public', 'profiles', 'public_code', 'public code is required');
select col_is_unique('public', 'profiles', 'public_code', 'public code is unique');
select policies_are(
  'public',
  'profiles',
  array[
    'users can read their own profile',
    'users can update their own profile'
  ],
  'profiles exposes only own-row policies'
);
select ok(
  (select relrowsecurity from pg_class where oid = 'public.profiles'::regclass),
  'RLS is enabled'
);
select ok(
  private.generate_public_code() ~ '^[A-Za-z0-9]{12}$',
  'public code has the required Base62 format'
);
select isnt(
  private.generate_public_code(),
  private.generate_public_code(),
  'independent public code calls produce different values'
);
select is(
  (
    select count(*)::integer
    from information_schema.role_table_grants
    where table_schema = 'public'
      and table_name = 'profiles'
      and grantee = 'anon'
  ),
  0,
  'anon has no profile table privileges'
);

select lives_ok(
  $$
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
      '10000000-0000-0000-0000-000000000001',
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated',
      'profile-test@example.invalid',
      '',
      '{"provider":"google","providers":["google"]}'::jsonb,
      '{"full_name":"Test User"}'::jsonb,
      now(),
      now()
    )
  $$,
  'creating an auth user also creates a profile'
);
select is(
  (
    select display_name
    from public.profiles
    where id = '10000000-0000-0000-0000-000000000001'
  ),
  'Test User',
  'profile captures the provider display name'
);
select matches(
  (
    select public_code
    from public.profiles
    where id = '10000000-0000-0000-0000-000000000001'
  ),
  '^[A-Za-z0-9]{12}$',
  'trigger creates a 12-character Base62 public code'
);
select lives_ok(
  $$
    delete from auth.users
    where id = '10000000-0000-0000-0000-000000000001'
  $$,
  'deleting an auth user cascades to the profile'
);
select is(
  (
    select count(*)::integer
    from public.profiles
    where id = '10000000-0000-0000-0000-000000000001'
  ),
  0,
  'the profile row is removed by cascade'
);

select * from finish();
rollback;
