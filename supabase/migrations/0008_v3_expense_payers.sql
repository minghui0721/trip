-- Several people can pay one expense. Each person's payment is an equal share
-- of the amount. Existing expenses keep their single payer.
-- Run once in Supabase → SQL Editor, after 0007_v3_expenses.sql.

create table public.expense_payments (
  expense_id  uuid not null references public.expenses (id) on delete cascade,
  user_id     uuid not null references public.profiles (id),
  amount      numeric(12, 2) not null check (amount > 0),
  primary key (expense_id, user_id)
);

insert into public.expense_payments (expense_id, user_id, amount)
select id, payer_id, amount
from public.expenses;

drop policy "expenses: members can add" on public.expenses;
drop policy "expenses: members can update" on public.expenses;

alter table public.expenses drop column payer_id;

create policy "expenses: members can add" on public.expenses
  for insert to authenticated
  with check (
    public.is_trip_member(trip_id)
    and created_by = (select auth.uid())
  );

create policy "expenses: members can update" on public.expenses
  for update to authenticated
  using (public.is_trip_member(trip_id))
  with check (public.is_trip_member(trip_id));

alter table public.expense_payments enable row level security;

create policy "payments: members can read" on public.expense_payments
  for select to authenticated
  using (
    exists (
      select 1 from public.expenses e
      where e.id = expense_id and public.is_trip_member(e.trip_id)
    )
  );

create policy "payments: members can add" on public.expense_payments
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

create policy "payments: members can delete" on public.expense_payments
  for delete to authenticated
  using (
    exists (
      select 1 from public.expenses e
      where e.id = expense_id and public.is_trip_member(e.trip_id)
    )
  );

revoke all on public.expense_payments from anon, public;
grant select, delete on public.expense_payments to authenticated;
grant insert (expense_id, user_id, amount) on public.expense_payments to authenticated;

notify pgrst, 'reload schema';
