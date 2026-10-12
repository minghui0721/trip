-- Let someone join a trip with its invite link, e.g. /join/3f9a2c7b1e04.
-- Run once in Supabase → SQL Editor, after 0001_v0_trips.sql.
-- The link does not expire. Anyone signed in who has it joins immediately.

-------------------------------------------------------------------------------
-- 1. Preview: name, dates, and the owner's name for a code, without joining.
--    Signed-out visitors need this, so anon can call it.
--    It only returns the trip that matches the code.
--    Drop first so re-running this file can change the returned columns.
-------------------------------------------------------------------------------
drop function if exists public.trip_by_invite(text);

create function public.trip_by_invite(p_code text)
returns table (
  id          uuid,
  name        text,
  destination text,
  start_date  date,
  end_date    date,
  owner_name  text
)
language sql
stable
security definer
set search_path = ''
as $$
  select t.id, t.name, t.destination, t.start_date, t.end_date, owner.display_name
  from public.trips t
  join public.trip_members m on m.trip_id = t.id and m.role = 'owner'
  join public.profiles owner on owner.id = m.user_id
  where t.invite_code = lower(btrim(p_code))
  limit 1;
$$;

revoke all on function public.trip_by_invite(text) from public;
grant execute on function public.trip_by_invite(text) to anon, authenticated;

-------------------------------------------------------------------------------
-- 2. Join: add the signed-in user as a member. Safe to call again.
--    This is the only way to insert a member; trip_members has no insert grant.
-------------------------------------------------------------------------------
create or replace function public.join_trip(p_code text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_trip_id uuid;
  v_user_id uuid := auth.uid();
begin
  if v_user_id is null then
    raise exception 'not authenticated' using errcode = '28000';
  end if;

  select t.id into v_trip_id
  from public.trips t
  where t.invite_code = lower(btrim(p_code));

  if v_trip_id is null then
    raise exception 'invite not found' using errcode = 'P0002';
  end if;

  insert into public.trip_members (trip_id, user_id, role)
  values (v_trip_id, v_user_id, 'member')
  on conflict (trip_id, user_id) do nothing;

  return v_trip_id;
end;
$$;

revoke all on function public.join_trip(text) from public;
grant execute on function public.join_trip(text) to authenticated;

-- Make the new functions visible to the API immediately.
notify pgrst, 'reload schema';
