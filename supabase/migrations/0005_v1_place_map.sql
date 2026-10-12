-- V1: save the map pin for a place.
-- Run once in Supabase → SQL Editor, after 0004_v1_place_details.sql.

alter table public.places
  add column latitude double precision,
  add column longitude double precision,
  add constraint places_coordinates_check check (
    (latitude is null and longitude is null)
    or (
      latitude between -90 and 90
      and longitude between -180 and 180
    )
  );

grant insert (latitude, longitude) on public.places to authenticated;
grant update (latitude, longitude) on public.places to authenticated;

notify pgrst, 'reload schema';
