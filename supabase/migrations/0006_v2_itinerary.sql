-- V2: day-by-day itinerary. An item can point at a place from V1.
-- Run once in Supabase → SQL Editor, after 0003_v1_places.sql.
-- Any member can add an item and change or remove one.

-------------------------------------------------------------------------------
-- 1. itinerary_items
-------------------------------------------------------------------------------
create table public.itinerary_items (
  id          uuid primary key default gen_random_uuid(),
  trip_id     uuid not null references public.trips (id) on delete cascade,
  place_id    uuid references public.places (id) on delete set null,
  day         date not null,
  starts_at   time,
  title       text not null check (char_length(title) between 1 and 100),
  notes       text check (notes is null or char_length(notes) between 1 and 500),
  created_by  uuid not null default auth.uid() references public.profiles (id),
  created_at  timestamptz not null default now()
);

create index itinerary_items_trip_day_idx
  on public.itinerary_items (trip_id, day, starts_at);

-------------------------------------------------------------------------------
-- 2. Permission rules: only members of the trip can see or change its plan
-------------------------------------------------------------------------------
alter table public.itinerary_items enable row level security;

create policy "itinerary: members can read" on public.itinerary_items
  for select to authenticated
  using (public.is_trip_member(trip_id));

create policy "itinerary: members can add" on public.itinerary_items
  for insert to authenticated
  with check (
    public.is_trip_member(trip_id)
    and created_by = (select auth.uid())
  );

create policy "itinerary: members can update" on public.itinerary_items
  for update to authenticated
  using (public.is_trip_member(trip_id))
  with check (public.is_trip_member(trip_id));

create policy "itinerary: members can delete" on public.itinerary_items
  for delete to authenticated
  using (public.is_trip_member(trip_id));

-------------------------------------------------------------------------------
-- 3. Table access for the website (RLS above still decides which rows)
-------------------------------------------------------------------------------
revoke all on public.itinerary_items from anon, public;

grant select, delete on public.itinerary_items to authenticated;
grant insert (trip_id, place_id, day, starts_at, title, notes)
  on public.itinerary_items to authenticated;
grant update (place_id, day, starts_at, title, notes)
  on public.itinerary_items to authenticated;

notify pgrst, 'reload schema';
