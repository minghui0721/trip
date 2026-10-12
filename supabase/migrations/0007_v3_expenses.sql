-- V3: expenses and who shares each one.
-- Run once in Supabase → SQL Editor, after 0001_v0_trips.sql.
-- Amounts stay in the currency they were paid in. Any member can add,
-- change, or remove an expense.

-------------------------------------------------------------------------------
-- 1. expenses
-------------------------------------------------------------------------------
create table public.expenses (
  id          uuid primary key default gen_random_uuid(),
  trip_id     uuid not null references public.trips (id) on delete cascade,
  title       text not null check (char_length(title) between 1 and 100),
  amount      numeric(12, 2) not null check (amount > 0),
  currency    text not null check (currency ~ '^[A-Z]{3}$'),
  payer_id    uuid not null references public.profiles (id),
  spent_on    date,
  created_by  uuid not null default auth.uid() references public.profiles (id),
  created_at  timestamptz not null default now()
);

create index expenses_trip_id_idx on public.expenses (trip_id, created_at);

-------------------------------------------------------------------------------
-- 2. expense_splits: each person's share. The shares add up to the amount.
-------------------------------------------------------------------------------
create table public.expense_splits (
  expense_id  uuid not null references public.expenses (id) on delete cascade,
  user_id     uuid not null references public.profiles (id),
  amount      numeric(12, 2) not null check (amount > 0),
  primary key (expense_id, user_id)
);

-------------------------------------------------------------------------------
-- 3. Permission rules
-------------------------------------------------------------------------------
alter table public.expenses enable row level security;
alter table public.expense_splits enable row level security;

create policy "expenses: members can read" on public.expenses
  for select to authenticated
  using (public.is_trip_member(trip_id));

create policy "expenses: members can add" on public.expenses
  for insert to authenticated
  with check (
    public.is_trip_member(trip_id)
    and created_by = (select auth.uid())
    and exists (
      select 1 from public.trip_members
      where trip_id = expenses.trip_id and user_id = payer_id
    )
  );

create policy "expenses: members can update" on public.expenses
  for update to authenticated
  using (public.is_trip_member(trip_id))
  with check (
    public.is_trip_member(trip_id)
    and exists (
      select 1 from public.trip_members
      where trip_id = expenses.trip_id and user_id = payer_id
    )
  );

create policy "expenses: members can delete" on public.expenses
  for delete to authenticated
  using (public.is_trip_member(trip_id));

create policy "splits: members can read" on public.expense_splits
  for select to authenticated
  using (
    exists (
      select 1 from public.expenses e
      where e.id = expense_id and public.is_trip_member(e.trip_id)
    )
  );

create policy "splits: members can add" on public.expense_splits
  for insert to authenticated
  with check (
    exists (
      select 1
      from public.expenses e
      join public.trip_members m
        on m.trip_id = e.trip_id and m.user_id = user_id
      where e.id = expense_id and public.is_trip_member(e.trip_id)
    )
  );

create policy "splits: members can delete" on public.expense_splits
  for delete to authenticated
  using (
    exists (
      select 1 from public.expenses e
      where e.id = expense_id and public.is_trip_member(e.trip_id)
    )
  );

-------------------------------------------------------------------------------
-- 4. Table access for the website (RLS above still decides which rows)
-------------------------------------------------------------------------------
revoke all on public.expenses, public.expense_splits from anon, public;

grant select, delete on public.expenses to authenticated;
grant insert (trip_id, title, amount, currency, payer_id, spent_on)
  on public.expenses to authenticated;
grant update (title, amount, currency, payer_id, spent_on)
  on public.expenses to authenticated;

grant select, delete on public.expense_splits to authenticated;
grant insert (expense_id, user_id, amount) on public.expense_splits to authenticated;

notify pgrst, 'reload schema';
