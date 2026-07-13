create function private.is_valid_weekday_schedule(p_schedule_weekdays smallint[])
returns boolean language sql immutable set search_path = '' as $$
  select cardinality(p_schedule_weekdays) between 1 and 7
    and p_schedule_weekdays <@ array[0, 1, 2, 3, 4, 5, 6]::smallint[]
    and cardinality(p_schedule_weekdays) = (select count(distinct value) from unnest(p_schedule_weekdays) as weekday(value));
$$;

revoke all on function private.is_valid_weekday_schedule(smallint[]) from public, anon, authenticated;

create table public.challenges (
  id uuid primary key default extensions.gen_random_uuid(),
  creator_id uuid not null references public.profiles(id) on delete cascade,
  title varchar(80) not null check (char_length(trim(title)) between 1 and 80),
  starts_on date not null,
  ends_on date not null check (ends_on >= starts_on),
  schedule_weekdays smallint[] not null check (private.is_valid_weekday_schedule(schedule_weekdays)),
  status text not null check (status in ('invited', 'active', 'cancelled', 'completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.challenge_members (
  challenge_id uuid not null references public.challenges(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  status text not null check (status in ('invited', 'accepted', 'declined')),
  linked_plan_id uuid references public.plans(id) on delete set null,
  linked_routine_item_id uuid references public.routine_items(id) on delete set null,
  created_at timestamptz not null default now(),
  responded_at timestamptz,
  primary key (challenge_id, user_id)
);

alter table public.challenges enable row level security;
alter table public.challenge_members enable row level security;
revoke all on table public.challenges, public.challenge_members from public, anon, authenticated;

create index challenges_creator_id_idx on public.challenges(creator_id);
create index challenge_members_user_status_idx on public.challenge_members(user_id, created_at desc) where status = 'invited';

create trigger set_challenges_updated_at before update on public.challenges for each row execute function private.set_profile_updated_at();

create function public.create_one_to_one_challenge(p_friend_id uuid, p_title text, p_starts_on date, p_ends_on date, p_schedule_weekdays smallint[])
returns public.challenges language plpgsql security definer set search_path = '' as $$
declare caller_id uuid := auth.uid(); created_challenge public.challenges%rowtype; created_plan public.plans%rowtype; created_routine public.routine_items%rowtype;
begin
  if caller_id is null then raise exception 'AUTH_REQUIRED'; end if;
  if char_length(trim(coalesce(p_title, ''))) not between 1 and 80 or p_starts_on is null or p_ends_on is null or p_ends_on < p_starts_on or cardinality(p_schedule_weekdays) not between 1 and 7 or exists (select 1 from unnest(p_schedule_weekdays) as weekday(value) where value not between 0 and 6) or cardinality(p_schedule_weekdays) <> (select count(distinct value) from unnest(p_schedule_weekdays) as weekday(value)) then raise exception 'INVALID_CHALLENGE_INPUT'; end if;
  if not exists (select 1 from public.friendships where status = 'accepted' and ((requester_id = caller_id and addressee_id = p_friend_id) or (requester_id = p_friend_id and addressee_id = caller_id))) then raise exception 'FRIEND_NOT_FOUND'; end if;
  if exists (select 1 from public.user_blocks where (blocker_id = caller_id and blocked_id = p_friend_id) or (blocker_id = p_friend_id and blocked_id = caller_id)) then raise exception 'USER_BLOCKED'; end if;
  insert into public.challenges (creator_id,title,starts_on,ends_on,schedule_weekdays,status) values (caller_id,trim(p_title),p_starts_on,p_ends_on,p_schedule_weekdays,'invited') returning * into created_challenge;
  insert into public.plans (user_id,title,starts_on,ends_on) values (caller_id,trim(p_title),p_starts_on,p_ends_on) returning * into created_plan;
  insert into public.routine_items (plan_id,user_id,title,schedule_weekdays,starts_on,ends_on) values (created_plan.id,caller_id,trim(p_title),p_schedule_weekdays,p_starts_on,p_ends_on) returning * into created_routine;
  insert into public.challenge_members (challenge_id,user_id,status,linked_plan_id,linked_routine_item_id,responded_at) values (created_challenge.id,caller_id,'accepted',created_plan.id,created_routine.id,now()),(created_challenge.id,p_friend_id,'invited',null,null,null);
  return created_challenge;
end;
$$;

create function public.respond_to_one_to_one_challenge(p_challenge_id uuid, p_response text)
returns public.challenges language plpgsql security definer set search_path = '' as $$
declare caller_id uuid := auth.uid(); challenge_row public.challenges%rowtype; created_plan public.plans%rowtype; created_routine public.routine_items%rowtype;
begin
  if caller_id is null then raise exception 'AUTH_REQUIRED'; end if;
  if p_response not in ('accepted','declined') then raise exception 'INVALID_CHALLENGE_RESPONSE'; end if;
  select * into challenge_row from public.challenges where id=p_challenge_id; if challenge_row.id is null then raise exception 'CHALLENGE_NOT_FOUND'; end if;
  if not exists (select 1 from public.challenge_members where challenge_id=p_challenge_id and user_id=caller_id and status='invited') then raise exception 'CHALLENGE_INVITATION_NOT_FOUND'; end if;
  if exists (select 1 from public.user_blocks where (blocker_id=caller_id and blocked_id=challenge_row.creator_id) or (blocker_id=challenge_row.creator_id and blocked_id=caller_id)) then raise exception 'USER_BLOCKED'; end if;
  if p_response='declined' then update public.challenge_members set status='declined', responded_at=now() where challenge_id=p_challenge_id and user_id=caller_id; update public.challenges set status='cancelled' where id=p_challenge_id; return (select * from public.challenges where id=p_challenge_id); end if;
  insert into public.plans (user_id,title,starts_on,ends_on) values (caller_id,challenge_row.title,challenge_row.starts_on,challenge_row.ends_on) returning * into created_plan;
  insert into public.routine_items (plan_id,user_id,title,schedule_weekdays,starts_on,ends_on) values (created_plan.id,caller_id,challenge_row.title,challenge_row.schedule_weekdays,challenge_row.starts_on,challenge_row.ends_on) returning * into created_routine;
  update public.challenge_members set status='accepted', linked_plan_id=created_plan.id, linked_routine_item_id=created_routine.id, responded_at=now() where challenge_id=p_challenge_id and user_id=caller_id;
  update public.challenges set status='active' where id=p_challenge_id returning * into challenge_row;
  return challenge_row;
end;
$$;

create function public.list_challenge_invitations() returns table (id uuid,title varchar,starts_on date,ends_on date,schedule_weekdays smallint[],creator_name varchar) language sql security definer set search_path = '' stable as $$ select challenge.id,challenge.title,challenge.starts_on,challenge.ends_on,challenge.schedule_weekdays,profile.display_name from public.challenge_members member join public.challenges challenge on challenge.id=member.challenge_id join public.profiles profile on profile.id=challenge.creator_id where member.user_id=(select auth.uid()) and member.status='invited' order by challenge.created_at desc; $$;

revoke all on function public.create_one_to_one_challenge(uuid,text,date,date,smallint[]) from public,anon;
revoke all on function public.respond_to_one_to_one_challenge(uuid,text) from public,anon;
revoke all on function public.list_challenge_invitations() from public,anon;
grant execute on function public.create_one_to_one_challenge(uuid,text,date,date,smallint[]) to authenticated;
grant execute on function public.respond_to_one_to_one_challenge(uuid,text) to authenticated;
grant execute on function public.list_challenge_invitations() to authenticated;
