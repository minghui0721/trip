import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { formatPayerNames, settlementSides, settleExpenses } from "@/lib/expense";
import { ExpensesSection, type TripExpense } from "../expenses-section";
import { loadExpenses, loadTripShell } from "../trip-data";
import { TripShell } from "../trip-shell";

export default async function TripExpensesPage({ params }: PageProps<"/trips/[id]/expenses">) {
  const { id } = await params;
  const { supabase, user } = await requireUser(`/trips/${id}/expenses`);
  const [{ trip, memberCount }, expenseResult, { data: members }] = await Promise.all([
    loadTripShell(supabase, id),
    loadExpenses(supabase, id),
    supabase.from("trip_members").select("user_id, profiles(display_name)").eq("trip_id", id),
  ]);
  if (!trip) notFound();

  const names = new Map(
    (members ?? []).map((member) => [member.user_id, member.profiles?.display_name ?? "Someone"]),
  );
  const expenses: TripExpense[] = expenseResult.expenses.map((expense) => ({
    id: expense.id,
    title: expense.title,
    cents: expense.cents,
    currency: expense.currency,
    payerName: formatPayerNames(expense.payments.map((payment) => names.get(payment.userId) ?? "Someone")),
    spentOn: expense.spentOn,
    splitCount: expense.shares.length,
  }));
  const balances = settlementSides(
    settleExpenses(
      expenseResult.expenses.map((expense) => ({
        currency: expense.currency,
        payments: expense.payments,
        shares: expense.shares,
      })),
      names,
    ),
  );

  return (
    <TripShell trip={trip} memberCount={memberCount} active="expenses">
      <ExpensesSection
        tripId={trip.id}
        expenses={expenses}
        balances={balances}
        currentUserId={user.id}
        unavailable={expenseResult.unavailable}
      />
    </TripShell>
  );
}
