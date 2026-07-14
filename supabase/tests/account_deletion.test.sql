begin;

create extension if not exists pgtap with schema extensions;

select plan(11);

insert into auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
values
  ('91000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'delete-a@example.invalid', '', '{}'::jsonb, '{"full_name":"Delete A"}'::jsonb, now(), now()),
  ('91000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'delete-b@example.invalid', '', '{}'::jsonb, '{"full_name":"Delete B"}'::jsonb, now(), now());

insert into public.plans (id, user_id, title, starts_on)
values ('91000000-0000-0000-0000-000000000010', '91000000-0000-0000-0000-000000000001', 'Delete plan', current_date);

insert into public.routine_items (id, plan_id, user_id, title, schedule_weekdays, starts_on)
values ('91000000-0000-0000-0000-000000000011', '91000000-0000-0000-0000-000000000010', '91000000-0000-0000-0000-000000000001', 'Delete routine', array[1]::smallint[], current_date);

select set_config('app.check_in_mutation', 'allowed', true);

insert into public.check_ins (user_id, routine_item_id, routine_day, completed_at, source, idempotency_key)
values ('91000000-0000-0000-0000-000000000001', '91000000-0000-0000-0000-000000000011', current_date, now(), 'online', '91000000-0000-0000-0000-000000000012');

insert into public.routine_item_status_events (routine_item_id, user_id, status)
values ('91000000-0000-0000-0000-000000000011', '91000000-0000-0000-0000-000000000001', 'active');

insert into public.friendships (requester_id, addressee_id, status)
values ('91000000-0000-0000-0000-000000000001', '91000000-0000-0000-0000-000000000002', 'accepted');

insert into public.user_blocks (blocker_id, blocked_id)
values ('91000000-0000-0000-0000-000000000002', '91000000-0000-0000-0000-000000000001');

insert into public.device_push_tokens (user_id, expo_push_token, platform, device_id_hash, locale)
values ('91000000-0000-0000-0000-000000000001', 'ExponentPushToken[delete-account]', 'android', repeat('a', 64), 'en');

insert into public.challenges (id, creator_id, title, starts_on, ends_on, schedule_weekdays, status)
values ('91000000-0000-0000-0000-000000000013', '91000000-0000-0000-0000-000000000001', 'Delete challenge', current_date, current_date, array[1]::smallint[], 'active');

insert into public.challenge_members (challenge_id, user_id, status)
values
  ('91000000-0000-0000-0000-000000000013', '91000000-0000-0000-0000-000000000001', 'accepted'),
  ('91000000-0000-0000-0000-000000000013', '91000000-0000-0000-0000-000000000002', 'accepted');

delete from auth.users where id = '91000000-0000-0000-0000-000000000001';

select is((select count(*)::integer from public.profiles where id = '91000000-0000-0000-0000-000000000001'), 0, 'account deletion removes the profile and public code');
select is((select count(*)::integer from public.plans where user_id = '91000000-0000-0000-0000-000000000001'), 0, 'account deletion removes owned plans');
select is((select count(*)::integer from public.routine_items where user_id = '91000000-0000-0000-0000-000000000001'), 0, 'account deletion removes owned routine items');
select is((select count(*)::integer from public.check_ins where user_id = '91000000-0000-0000-0000-000000000001'), 0, 'account deletion removes check-ins');
select is((select count(*)::integer from public.routine_item_status_events where user_id = '91000000-0000-0000-0000-000000000001'), 0, 'account deletion removes status history');
select is((select count(*)::integer from public.friendships where requester_id = '91000000-0000-0000-0000-000000000001' or addressee_id = '91000000-0000-0000-0000-000000000001'), 0, 'account deletion removes friend relationships');
select is((select count(*)::integer from public.user_blocks where blocker_id = '91000000-0000-0000-0000-000000000001' or blocked_id = '91000000-0000-0000-0000-000000000001'), 0, 'account deletion removes blocking relationships');
select is((select count(*)::integer from public.device_push_tokens where user_id = '91000000-0000-0000-0000-000000000001'), 0, 'account deletion removes push tokens');
select is((select count(*)::integer from public.challenges where creator_id = '91000000-0000-0000-0000-000000000001'), 0, 'account deletion removes challenges created by the account');
select is((select count(*)::integer from public.challenge_members where challenge_id = '91000000-0000-0000-0000-000000000013'), 0, 'challenge memberships cascade with the deleted challenge');
select is((select count(*)::integer from public.profiles where id = '91000000-0000-0000-0000-000000000002'), 1, 'another user profile remains');

select * from finish();
rollback;
