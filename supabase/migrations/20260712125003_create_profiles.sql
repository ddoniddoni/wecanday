create extension if not exists pgcrypto with schema extensions;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create function private.generate_public_code()
returns text
language plpgsql
volatile
set search_path = ''
as $$
declare
  alphabet constant text := 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  random_bytes bytea;
  random_value integer;
  result text := '';
  byte_index integer;
begin
  while length(result) < 12 loop
    random_bytes := extensions.gen_random_bytes(16);

    for byte_index in 0..15 loop
      random_value := get_byte(random_bytes, byte_index);

      if random_value < 248 then
        result := result || substr(alphabet, (random_value % 62) + 1, 1);

        if length(result) = 12 then
          return result;
        end if;
      end if;
    end loop;
  end loop;

  return result;
end;
$$;

revoke all on function private.generate_public_code() from public, anon, authenticated;

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name varchar(30) not null check (char_length(display_name) between 1 and 30),
  country_code char(2) check (country_code is null or country_code ~ '^[A-Z]{2}$'),
  locale varchar(16) check (
    locale is null or locale ~ '^[A-Za-z]{2,3}(-[A-Za-z0-9]{2,8})*$'
  ),
  public_code varchar(12) collate "C" not null unique check (
    public_code ~ '^[A-Za-z0-9]{12}$'
  ),
  avatar_seed text not null,
  theme_id text not null default 'system',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

revoke all on table public.profiles from public, anon, authenticated;
grant usage on schema public to authenticated;
grant select on table public.profiles to authenticated;
grant update (display_name, country_code, locale, avatar_seed, theme_id)
  on table public.profiles to authenticated;

create policy "users can read their own profile"
on public.profiles
for select
to authenticated
using ((select auth.uid()) = id);

create policy "users can update their own profile"
on public.profiles
for update
to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

create function private.set_profile_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

revoke all on function private.set_profile_updated_at() from public, anon, authenticated;

create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function private.set_profile_updated_at();

create function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  attempt integer;
  candidate_display_name text;
begin
  candidate_display_name := left(
    coalesce(
      nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
      nullif(trim(new.raw_user_meta_data ->> 'name'), ''),
      'WeCanDay'
    ),
    30
  );

  for attempt in 1..10 loop
    begin
      insert into public.profiles (
        id,
        display_name,
        public_code,
        avatar_seed
      )
      values (
        new.id,
        candidate_display_name,
        private.generate_public_code(),
        encode(extensions.gen_random_bytes(8), 'hex')
      );

      return new;
    exception
      when unique_violation then
        if attempt = 10 then
          raise;
        end if;
    end;
  end loop;

  return new;
end;
$$;

revoke all on function private.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function private.handle_new_user();
