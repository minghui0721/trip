-- V1: a place can have a location and photos.
-- Run once in Supabase → SQL Editor, after 0003_v1_places.sql.
-- Location is text (an address or a maps link). Photos live in a private bucket.

-------------------------------------------------------------------------------
-- 1. location on the place
-------------------------------------------------------------------------------
alter table public.places
  add column location text check (location is null or char_length(location) between 1 and 500);

grant insert (location) on public.places to authenticated;
grant update (location) on public.places to authenticated;

-------------------------------------------------------------------------------
-- 2. place_photos: one row per uploaded file
-------------------------------------------------------------------------------
create table public.place_photos (
  id          uuid primary key default gen_random_uuid(),
  place_id    uuid not null references public.places (id) on delete cascade,
  path        text not null,
  created_by  uuid not null default auth.uid() references public.profiles (id),
  created_at  timestamptz not null default now()
);

create index place_photos_place_id_idx on public.place_photos (place_id, created_at);

alter table public.place_photos enable row level security;

create policy "place_photos: members can read" on public.place_photos
  for select to authenticated
  using (
    exists (
      select 1 from public.places
      where places.id = place_id and public.is_trip_member(places.trip_id)
    )
  );

create policy "place_photos: members can add" on public.place_photos
  for insert to authenticated
  with check (
    created_by = (select auth.uid())
    and exists (
      select 1 from public.places
      where places.id = place_id and public.is_trip_member(places.trip_id)
    )
  );

create policy "place_photos: members can delete" on public.place_photos
  for delete to authenticated
  using (
    exists (
      select 1 from public.places
      where places.id = place_id and public.is_trip_member(places.trip_id)
    )
  );

revoke all on public.place_photos from anon, public;
grant select, delete on public.place_photos to authenticated;
grant insert (place_id, path) on public.place_photos to authenticated;

-------------------------------------------------------------------------------
-- 3. Private photo bucket. Path is {trip_id}/{place_id}/{file}.
--    Only members of that trip can read or write those files.
-------------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'place-photos',
  'place-photos',
  false,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

-- True only when the first folder is a trip id the current user belongs to.
create or replace function public.can_access_place_photo(object_name text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.is_trip_member(
    case
      when (storage.foldername(object_name))[1] ~ '^[0-9a-f-]{36}$'
      then ((storage.foldername(object_name))[1])::uuid
      else null
    end
  );
$$;

revoke all on function public.can_access_place_photo(text) from public;
grant execute on function public.can_access_place_photo(text) to authenticated;

drop policy if exists "place photos: members can read" on storage.objects;
drop policy if exists "place photos: members can upload" on storage.objects;
drop policy if exists "place photos: members can delete" on storage.objects;

create policy "place photos: members can read" on storage.objects
  for select to authenticated
  using (
    bucket_id = 'place-photos'
    and public.can_access_place_photo(name)
  );

create policy "place photos: members can upload" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'place-photos'
    and owner = (select auth.uid())
    and public.can_access_place_photo(name)
  );

create policy "place photos: members can delete" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'place-photos'
    and public.can_access_place_photo(name)
  );

notify pgrst, 'reload schema';
