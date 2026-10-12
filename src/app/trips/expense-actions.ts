"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  amountFromCents,
  centsFromInput,
  equalShares,
  isExpenseCurrency,
} from "@/lib/expense";
import { isIsoDate } from "@/lib/itinerary";
import { createClient } from "@/lib/supabase/server";

export type ExpenseFormState = { error?: string };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isUuid(value: string) {
  return UUID.test(value);
}

function readExpense(formData: FormData) {
  const tripId = String(formData.get("trip_id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const currency = String(formData.get("currency") ?? "");
  const spentOn = String(formData.get("spent_on") ?? "");
  const cents = centsFromInput(String(formData.get("amount") ?? ""));
  const payerIds = [...new Set(formData.getAll("payer").map(String))];
  const splitIds = [...new Set(formData.getAll("split").map(String))];
  const splitMode = String(formData.get("split_mode") ?? "");

  if (!isUuid(tripId)) return { error: "This trip could not be found." };
  if (!title) return { error: "Please say what this was for." };
  if (title.length > 100) return { error: "That's too long (max 100 characters)." };
  if (cents === null) return { error: "Enter an amount greater than zero, with up to two decimal places." };
  if (!isExpenseCurrency(currency)) return { error: "Pick a currency." };
  if (payerIds.length !== 1 || !isUuid(payerIds[0] ?? "")) return { error: "Choose one person who paid." };
  if (spentOn && !isIsoDate(spentOn)) return { error: "That date isn't valid." };
  if (splitIds.length === 0 || splitIds.some((id) => !isUuid(id))) {
    return { error: "Choose who shares this." };
  }

  const shares = readShares(formData, splitMode, cents, splitIds);
  if ("error" in shares) return shares;

  return {
    tripId,
    title,
    cents,
    currency,
    payerIds,
    spentOn: spentOn || null,
    splitIds,
    shares,
  };
}

function readShares(
  formData: FormData,
  splitMode: string,
  cents: number,
  splitIds: string[],
): { userId: string; cents: number }[] | { error: string } {
  if (splitMode === "equal") return equalShares(cents, splitIds);
  if (splitMode !== "custom") return { error: "Choose who shares this." };

  const shares: { userId: string; cents: number }[] = [];
  for (const id of splitIds) {
    const shareCents = centsFromInput(String(formData.get(`share_${id}`) ?? ""));
    if (shareCents === null) {
      return { error: "Enter each person's price, greater than zero, with up to two decimal places." };
    }
    shares.push({ userId: id, cents: shareCents });
  }
  const sum = shares.reduce((total, share) => total + share.cents, 0);
  if (sum !== cents) return { error: "The prices have to add up to the amount." };
  return shares;
}

function writeError(message: string | undefined, fallback: string) {
  if (message?.includes("payer_id") || message?.includes("expense_payments")) {
    return "Several people paying one expense isn't set up yet. Run supabase/migrations/0008_v3_expense_payers.sql in the Supabase SQL Editor.";
  }
  if (message?.includes("expenses") || message?.includes("expense_splits") || message?.includes("schema cache")) {
    return "Expenses aren't set up yet. Run supabase/migrations/0007_v3_expenses.sql in the Supabase SQL Editor.";
  }
  return fallback;
}

function paymentRows(expenseId: string, payerIds: string[], cents: number) {
  return equalShares(cents, payerIds).map((share) => ({
    expense_id: expenseId,
    user_id: share.userId,
    amount: Number(amountFromCents(share.cents)),
  }));
}

async function memberIds(
  supabase: Awaited<ReturnType<typeof createClient>>,
  tripId: string,
) {
  const { data } = await supabase.from("trip_members").select("user_id").eq("trip_id", tripId);
  return new Set((data ?? []).map((member) => member.user_id));
}

export async function createExpense(
  _prev: ExpenseFormState,
  formData: FormData,
): Promise<ExpenseFormState> {
  const expense = readExpense(formData);
  if ("error" in expense) return expense;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/trips/${expense.tripId}/expenses/new`)}`);

  const members = await memberIds(supabase, expense.tripId);
  if (
    expense.payerIds.some((id) => !members.has(id)) ||
    expense.splitIds.some((id) => !members.has(id))
  ) {
    return { error: "Choose people who are on this trip." };
  }

  const { data, error } = await supabase
    .from("expenses")
    .insert({
      trip_id: expense.tripId,
      title: expense.title,
      amount: Number(amountFromCents(expense.cents)),
      currency: expense.currency,
      spent_on: expense.spentOn,
    })
    .select("id")
    .single();
  if (error || !data) return { error: writeError(error?.message, "Couldn't add this expense. Please try again.") };

  const { error: paymentError } = await supabase
    .from("expense_payments")
    .insert(paymentRows(data.id, expense.payerIds, expense.cents));
  if (paymentError) {
    await supabase.from("expenses").delete().eq("id", data.id);
    return { error: writeError(paymentError.message, "Couldn't save who paid. Please try again.") };
  }

  const { error: splitError } = await supabase.from("expense_splits").insert(
    expense.shares.map((share) => ({
      expense_id: data.id,
      user_id: share.userId,
      amount: Number(amountFromCents(share.cents)),
    })),
  );
  if (splitError) {
    await supabase.from("expenses").delete().eq("id", data.id);
    return { error: writeError(splitError.message, "Couldn't save who shares this. Please try again.") };
  }

  revalidatePath(`/trips/${expense.tripId}/expenses`);
  redirect(`/trips/${expense.tripId}/expenses`);
}

export async function updateExpense(
  _prev: ExpenseFormState,
  formData: FormData,
): Promise<ExpenseFormState> {
  const expenseId = String(formData.get("expense_id") ?? "");
  const expense = readExpense(formData);
  if (!isUuid(expenseId)) return { error: "This expense could not be found." };
  if ("error" in expense) return expense;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/login?next=${encodeURIComponent(`/trips/${expense.tripId}/expenses/${expenseId}/edit`)}`);
  }

  const members = await memberIds(supabase, expense.tripId);
  if (
    expense.payerIds.some((id) => !members.has(id)) ||
    expense.splitIds.some((id) => !members.has(id))
  ) {
    return { error: "Choose people who are on this trip." };
  }

  const { data: previous } = await supabase
    .from("expense_splits")
    .select("user_id, amount")
    .eq("expense_id", expenseId);
  const { data: previousPayments } = await supabase
    .from("expense_payments")
    .select("user_id, amount")
    .eq("expense_id", expenseId);

  const { data, error } = await supabase
    .from("expenses")
    .update({
      title: expense.title,
      amount: Number(amountFromCents(expense.cents)),
      currency: expense.currency,
      spent_on: expense.spentOn,
    })
    .eq("id", expenseId)
    .eq("trip_id", expense.tripId)
    .select("id")
    .maybeSingle();
  if (error || !data) return { error: writeError(error?.message, "Couldn't save this expense. Please try again.") };

  const { error: clearPayments } = await supabase.from("expense_payments").delete().eq("expense_id", expenseId);
  if (clearPayments) return { error: writeError(clearPayments.message, "Couldn't save who paid. Please try again.") };
  const { error: paymentError } = await supabase
    .from("expense_payments")
    .insert(paymentRows(expenseId, expense.payerIds, expense.cents));
  if (paymentError) {
    if (previousPayments && previousPayments.length > 0) {
      await supabase.from("expense_payments").insert(
        previousPayments.map((payment) => ({
          expense_id: expenseId,
          user_id: payment.user_id,
          amount: payment.amount,
        })),
      );
    }
    return { error: writeError(paymentError.message, "Couldn't save who paid. Please try again.") };
  }

  const { error: deleteError } = await supabase.from("expense_splits").delete().eq("expense_id", expenseId);
  if (deleteError) return { error: "Couldn't save who shares this. Please try again." };

  const { error: splitError } = await supabase.from("expense_splits").insert(
    expense.shares.map((share) => ({
      expense_id: expenseId,
      user_id: share.userId,
      amount: Number(amountFromCents(share.cents)),
    })),
  );
  if (splitError) {
    if (previous && previous.length > 0) {
      await supabase.from("expense_splits").insert(
        previous.map((share) => ({
          expense_id: expenseId,
          user_id: share.user_id,
          amount: share.amount,
        })),
      );
    }
    return { error: writeError(splitError.message, "Couldn't save who shares this. Please try again.") };
  }

  revalidatePath(`/trips/${expense.tripId}/expenses`);
  redirect(`/trips/${expense.tripId}/expenses`);
}

export async function deleteExpense(formData: FormData) {
  const tripId = String(formData.get("trip_id") ?? "");
  const expenseId = String(formData.get("expense_id") ?? "");
  if (!isUuid(tripId) || !isUuid(expenseId)) return;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=${encodeURIComponent(`/trips/${tripId}/expenses`)}`);

  await supabase.from("expenses").delete().eq("id", expenseId).eq("trip_id", tripId);
  revalidatePath(`/trips/${tripId}/expenses`);
}
