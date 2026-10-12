import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { amountFromCents, centsFromAmount, isExpenseCurrency } from "@/lib/expense";
import { ExpenseForm } from "../../expense-form";

export default async function EditExpensePage({
  params,
}: PageProps<"/trips/[id]/expenses/[expenseId]/edit">) {
  const { id, expenseId } = await params;
  const { supabase, user } = await requireUser(`/trips/${id}/expenses/${expenseId}/edit`);

  const { data: trip } = await supabase.from("trips").select("id, name").eq("id", id).maybeSingle();
  if (!trip) notFound();

  const [{ data: expense }, paymentsResult, { data: splits }, { data: members }] = await Promise.all([
    supabase
      .from("expenses")
      .select("id, title, amount, currency, spent_on")
      .eq("id", expenseId)
      .eq("trip_id", trip.id)
      .maybeSingle(),
    supabase.from("expense_payments").select("user_id").eq("expense_id", expenseId),
    supabase.from("expense_splits").select("user_id, amount").eq("expense_id", expenseId),
    supabase
      .from("trip_members")
      .select("user_id, profiles(display_name)")
      .eq("trip_id", trip.id)
      .order("joined_at"),
  ]);
  if (!expense || !isExpenseCurrency(expense.currency)) notFound();
  const paymentsMissing =
    paymentsResult.error?.code === "PGRST205" ||
    paymentsResult.error?.message.includes("expense_payments") === true;
  let payerIds = (paymentsResult.data ?? []).map((payment) => payment.user_id);
  if (paymentsMissing) {
    const legacy = await supabase.from("expenses").select("payer_id").eq("id", expenseId).maybeSingle();
    payerIds = legacy.data?.payer_id ? [legacy.data.payer_id] : [];
  }

  const cents = centsFromAmount(expense.amount);
  if (cents === null || cents <= 0) notFound();

  const people = (members ?? []).map((member) => ({
    id: member.user_id,
    name: member.profiles?.display_name ?? "Someone",
  }));

  return (
    <div className="flex flex-1 flex-col bg-gradient-to-b from-secondary to-background to-40%">
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-8 px-5 pt-[max(1rem,env(safe-area-inset-top))] pb-12 md:max-w-lg md:pt-12">
        <Link
          href={`/trips/${trip.id}/expenses`}
          aria-label="Back to the trip"
          className="-ml-1 flex size-9 items-center justify-center rounded-full bg-black/30 transition-colors hover:bg-black/50"
        >
          <ChevronLeft className="size-5" />
        </Link>
        <div>
          <p className="text-sm font-medium text-muted-foreground">{trip.name}</p>
          <h1 className="mt-1 text-4xl font-black tracking-tighter md:text-5xl">Edit expense</h1>
        </div>
        <ExpenseForm
          tripId={trip.id}
          people={people}
          currentUserId={user.id}
          expense={{
            id: expense.id,
            title: expense.title,
            amount: amountFromCents(cents),
            currency: expense.currency,
            payerIds,
            spentOn: expense.spent_on ?? "",
            shares: (splits ?? []).flatMap((split) => {
              const shareCents = centsFromAmount(split.amount);
              if (shareCents === null || shareCents <= 0) return [];
              return [{ userId: split.user_id, cents: shareCents }];
            }),
          }}
        />
      </main>
    </div>
  );
}
