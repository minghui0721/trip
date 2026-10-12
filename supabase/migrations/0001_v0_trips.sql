-- V0: profiles, trips, trip_members + permission rules (RLS)
-- Run once in Supabase → SQL Editor.

-------------------------------------------------------------------------------
-- 1. profiles: the public part of a user (name + avatar), visible to trip mates
-------------------------------------------------------------------------------
create table public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  avatar_url   text,
  created_at   timestamptz not null default now()
);

-- Copy name + avatar from Google when someone signs up.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name',
      split_part(new.email, '@', 1)
    ),
    new.raw_user_meta_data ->> 'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Create profiles for users who signed up before this table existed.
insert into public.profiles (id, display_name, avatar_url)
select
  id,
  coalesce(
    raw_user_meta_data ->> 'full_name',
    raw_user_meta_data ->> 'name',
    split_part(email, '@', 1)
  ),
  raw_user_meta_data ->> 'avatar_url'
from auth.users
on conflict (id) do nothing;

-------------------------------------------------------------------------------
-- 2. trips
-------------------------------------------------------------------------------
create table public.trips (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(name) between 1 and 100),
  destination text check (char_length(destination) <= 100),
  start_date  date,
  end_date    date,
  -- The code in the invite link, e.g. /join/3f9a2c7b1e04
  invite_code text not null unique
              default substr(replace(gen_random_uuid()::text, '-', ''), 1, 12),
  created_by  uuid not null default auth.uid() references public.profiles (id),
  created_at  timestamptz not null default now(),
  check (end_date is null or start_date is null or end_date >= start_date)
);

-------------------------------------------------------------------------------
-- 3. trip_members: who is in which trip, and their role
-------------------------------------------------------------------------------
create table public.trip_members (
  trip_id   uuid not null references public.trips (id) on delete cascade,
  user_id   uuid not null references public.profiles (id) on delete cascade,
  role      text not null default 'member' check (role in ('owner', 'member')),
  joined_at timestamptz not null default now(),
  primary key (trip_id, user_id)
);

create index trip_members_user_id_idx on public.trip_members (user_id);

-- Whoever creates a trip automatically becomes its owner.
create function public.add_trip_owner()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.trip_members (trip_id, user_id, role)
  values (new.id, new.created_by, 'owner');
  return new;
end;
$$;

create trigger on_trip_created
  after insert on public.trips
  for each row execute function public.add_trip_owner();

-------------------------------------------------------------------------------
-- 4. Helper checks used by the permission rules
--    (security definer so they can read trip_members without looping on RLS)
-------------------------------------------------------------------------------
create function public.is_trip_member(p_trip_id uuid)
returns boolean
language sql stable
security definer set search_path = ''
as $$
  select exists (
    select 1 from public.trip_members
    where trip_id = p_trip_id and user_id = auth.uid()
  );
$$;

create function public.is_trip_owner(p_trip_id uuid)
returns boolean
language sql stable
security definer set search_path = ''
as $$
  select exists (
    select 1 from public.trip_members
    where trip_id = p_trip_id and user_id = auth.uid() and role = 'owner'
  );
$$;

-- True if the current user and p_user_id are in at least one trip together.
create function public.shares_trip_with(p_user_id uuid)
returns boolean
language sql stable
security definer set search_path = ''
as $$
  select exists (
    select 1
    from public.trip_members me
    join public.trip_members them on them.trip_id = me.trip_id
    where me.user_id = auth.uid() and them.user_id = p_user_id
  );
$$;

-------------------------------------------------------------------------------
-- 5. Permission rules (RLS)
-------------------------------------------------------------------------------
alter table public.profiles     enable row level security;
alter table public.trips        enable row level security;
alter table public.trip_members enable row level security;

-- profiles: see yourself and people you share a trip with; edit only yourself.
create policy "profiles: read self and trip mates" on public.profiles
  for select to authenticated
  using (id = (select auth.uid()) or public.shares_trip_with(id));

create policy "profiles: update self" on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- trips: members can see; anyone signed in can create; only the owner edits/deletes.
create policy "trips: members can read" on public.trips
  for select to authenticated
  using (created_by = (select auth.uid()) or public.is_trip_member(id));

create policy "trips: signed-in users can create" on public.trips
  for insert to authenticated
  with check (created_by = (select auth.uid()));

create policy "trips: owner can update" on public.trips
  for update to authenticated
  using (public.is_trip_owner(id))
  with check (public.is_trip_owner(id));

create policy "trips: owner can delete" on public.trips
  for delete to authenticated
  using (public.is_trip_owner(id));

-- trip_members: members can see each other.
-- Joining via an invite link goes through public.join_trip (0002_join_trip.sql).
-- Leaving: a member can remove themselves; the owner can remove others.
create policy "trip_members: members can read" on public.trip_members
  for select to authenticated
  using (public.is_trip_member(trip_id));

create policy "trip_members: leave or remove" on public.trip_members
  for delete to authenticated
  using (
    (user_id = (select auth.uid()) and role <> 'owner')
    or (public.is_trip_owner(trip_id) and user_id <> (select auth.uid()))
  );

-------------------------------------------------------------------------------
-- 6. Table access for the website (RLS above still decides which rows)
-------------------------------------------------------------------------------
revoke all on public.profiles, public.trips, public.trip_members from anon;

grant select on public.profiles to authenticated;
grant update (display_name, avatar_url) on public.profiles to authenticated;

grant select, delete on public.trips to authenticated;
grant insert (name, destination, start_date, end_date) on public.trips to authenticated;
grant update (name, destination, start_date, end_date) on public.trips to authenticated;

grant select, delete on public.trip_members to authenticated;
