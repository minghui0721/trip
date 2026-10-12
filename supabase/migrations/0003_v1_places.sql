-- V1: places on a trip (name, category, status, notes).
-- Run once in Supabase → SQL Editor, after 0002_join_trip.sql.
-- Any member can add a place and change or remove one. No map yet.

-------------------------------------------------------------------------------
-- 1. places
-------------------------------------------------------------------------------
create table public.places (
  id          uuid primary key default gen_random_uuid(),
  trip_id     uuid not null references public.trips (id) on delete cascade,
  name        text not null check (char_length(name) between 1 and 100),
  category    text not null check (category in ('eat', 'stay', 'see', 'do')),
  status      text not null default 'idea' check (status in ('idea', 'going', 'skipped')),
  notes       text check (notes is null or char_length(notes) between 1 and 500),
  created_by  uuid not null default auth.uid() references public.profiles (id),
  created_at  timestamptz not null default now()
);

create index places_trip_id_idx on public.places (trip_id, created_at);

-------------------------------------------------------------------------------
-- 2. Permission rules: only members of the trip can see or change its places
-------------------------------------------------------------------------------
alter table public.places enable row level security;

create policy "places: members can read" on public.places
  for select to authenticated
  using (public.is_trip_member(trip_id));

create policy "places: members can add" on public.places
  for insert to authenticated
  with check (
    public.is_trip_member(trip_id)
    and created_by = (select auth.uid())
  );

create policy "places: members can update" on public.places
  for update to authenticated
  using (public.is_trip_member(trip_id))
  with check (public.is_trip_member(trip_id));

create policy "places: members can delete" on public.places
  for delete to authenticated
  using (public.is_trip_member(trip_id));

-------------------------------------------------------------------------------
-- 3. Table access for the website (RLS above still decides which rows)
-------------------------------------------------------------------------------
revoke all on public.places from anon, public;

grant select, delete on public.places to authenticated;
grant insert (trip_id, name, category, status, notes) on public.places to authenticated;
grant update (name, category, status, notes) on public.places to authenticated;

notify pgrst, 'reload schema';
