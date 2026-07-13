begin;

create extension if not exists pgtap with schema extensions;
select plan(13);

select has_table('public', 'challenges', 'challenges table exists');
select has_table('public', 'challenge_members', 'challenge members table exists');
select ok((select relrowsecurity from pg_class where oid = 'public.challenges'::regclass), 'challenges has RLS');
select ok((select relrowsecurity from pg_class where oid = 'public.challenge_members'::regclass), 'challenge members has RLS');
select has_function('public', 'create_one_to_one_challenge', array['uuid', 'text', 'date', 'date', 'smallint[]'], 'create challenge RPC exists');
select has_function('public', 'respond_to_one_to_one_challenge', array['uuid', 'text'], 'respond challenge RPC exists');

insert into auth.users (id,instance_id,aud,role,email,encrypted_password,raw_app_meta_data,raw_user_meta_data,created_at,updated_at)
values
('80000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000000','authenticated','authenticated','challenge-a@example.invalid','','{}','{"full_name":"Challenge A"}',now(),now()),
('80000000-0000-0000-0000-000000000002','00000000-0000-0000-0000-000000000000','authenticated','authenticated','challenge-b@example.invalid','','{}','{"full_name":"Challenge B"}',now(),now()),
('80000000-0000-0000-0000-000000000003','00000000-0000-0000-0000-000000000000','authenticated','authenticated','challenge-c@example.invalid','','{}','{"full_name":"Challenge C"}',now(),now());

insert into public.friendships (requester_id,addressee_id,status,responded_at)
values
('80000000-0000-0000-0000-000000000001','80000000-0000-0000-0000-000000000002','accepted',now()),
('80000000-0000-0000-0000-000000000001','80000000-0000-0000-0000-000000000003','accepted',now());

set local role authenticated;
select set_config('request.jwt.claim.sub','80000000-0000-0000-0000-000000000001',true);
select is((public.create_one_to_one_challenge('80000000-0000-0000-0000-000000000002','Walk together',current_date,current_date + 7,array[1,3,5]::smallint[])).status,'invited','creator creates an invited challenge');
reset role;
select ok((select linked_routine_item_id is not null from public.challenge_members where user_id='80000000-0000-0000-0000-000000000001'), 'creator receives a linked routine');

set local role authenticated;
select set_config('request.jwt.claim.sub','80000000-0000-0000-0000-000000000002',true);
select is((select creator_name from public.list_challenge_invitations()),'Challenge A','invitee sees the creator minimal profile');
select is((public.respond_to_one_to_one_challenge((select id from public.list_challenge_invitations() where title='Walk together'),'accepted')).status,'active','invitee accepts the challenge');
reset role;
select is((select user_id from public.routine_items where id=(select linked_routine_item_id from public.challenge_members where user_id='80000000-0000-0000-0000-000000000002')),'80000000-0000-0000-0000-000000000002'::uuid,'invitee receives their own routine');

insert into public.plans (user_id,title,starts_on) values
('80000000-0000-0000-0000-000000000003','Limit 1',current_date),('80000000-0000-0000-0000-000000000003','Limit 2',current_date),('80000000-0000-0000-0000-000000000003','Limit 3',current_date),('80000000-0000-0000-0000-000000000003','Limit 4',current_date);
insert into public.routine_items (plan_id,user_id,title,schedule_weekdays,starts_on)
select id,'80000000-0000-0000-0000-000000000003','Existing',array[1]::smallint[],current_date from public.plans where user_id='80000000-0000-0000-0000-000000000003';

set local role authenticated;
select set_config('request.jwt.claim.sub','80000000-0000-0000-0000-000000000001',true);
select is((public.create_one_to_one_challenge('80000000-0000-0000-0000-000000000003','Limited challenge',current_date,current_date + 7,array[1]::smallint[])).status,'invited','creator can invite a friend at their routine limit');
reset role;

set local role authenticated;
select set_config('request.jwt.claim.sub','80000000-0000-0000-0000-000000000003',true);
select throws_ok($$select public.respond_to_one_to_one_challenge((select id from public.list_challenge_invitations() where title='Limited challenge'),'accepted')$$,'ROUTINE_LIMIT_REACHED','invite acceptance enforces the recipient active routine limit');
reset role;

select * from finish();
rollback;
