"use client";

import { useState } from "react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { formatMoney, type SettlementSide } from "@/lib/expense";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { AddPanel } from "./add-panel";
import { ExpenseForm } from "./expenses/expense-form";
import { RemoveExpense } from "./remove-expense";

export type TripExpense = {
  id: string;
  title: string;
  cents: number;
  currency: string;
  payerName: string;
  spentOn: string | null;
  splitCount: number;
};

export function ExpensesSection({
  tripId,
  expenses,
  balances,
  people,
  currentUserId,
  unavailable,
}: {
  tripId: string;
  expenses: TripExpense[];
  balances: { receive: SettlementSide[]; pay: SettlementSide[] };
  people: { id: string; name: string }[];
  currentUserId: string;
  unavailable?: "missing" | "failed";
}) {
  const [adding, setAdding] = useState(false);

  if (adding) {
    return (
      <AddPanel title="Add an expense" onBack={() => setAdding(false)}>
        <ExpenseForm tripId={tripId} people={people} currentUserId={currentUserId} />
      </AddPanel>
    );
  }

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-extrabold tracking-tight">Expenses</h2>
        {!unavailable && (
          <button type="button" onClick={() => setAdding(true)} className={cn(buttonVariants(), "h-10 px-4")}>
            Add
          </button>
        )}
      </div>

      {unavailable === "missing" && (
        <p className="text-sm text-muted-foreground">
          Expenses aren&apos;t in the database yet. Run supabase/migrations/0007_v3_expenses.sql in
          the Supabase SQL Editor, then reload this page.
        </p>
      )}
      {unavailable === "failed" && (
        <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          Couldn&apos;t load expenses. Check your connection and try again.
        </p>
      )}

      {!unavailable && expenses.length === 0 && (
        <div className="rounded-2xl bg-card px-6 py-10 text-center">
          <p className="text-lg font-extrabold tracking-tight">No expenses yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Add a payment and split it with the group.
          </p>
        </div>
      )}

      {!unavailable && expenses.length > 0 && (
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-3">
            <BalancePart
              title="Will receive"
              lines={balances.receive}
              currentUserId={currentUserId}
              empty="Nobody is owed anything."
              verb="will receive"
              youVerb="will receive"
              direction="from"
            />
            <BalancePart
              title="Need to pay"
              lines={balances.pay}
              currentUserId={currentUserId}
              empty="Nobody needs to pay."
              verb="needs to pay"
              youVerb="need to pay"
              direction="to"
              amountClassName="text-destructive"
            />
            <p className="text-sm text-muted-foreground">Each currency stays separate.</p>
          </div>

          <ul className="flex flex-col gap-3 md:grid md:grid-cols-2">
            {expenses.map((expense) => (
              <li key={expense.id} className="flex flex-col gap-2 rounded-xl bg-card p-4">
                <div>
                  <p className="font-extrabold tracking-tight">{expense.title}</p>
                  <p className="mt-1 text-lg font-black text-primary">
                    {formatMoney(expense.cents, expense.currency)}
                  </p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Paid by {expense.payerName}
                    {expense.spentOn ? ` · ${formatDate(expense.spentOn)}` : ""}
                    {` · Split ${expense.splitCount} ${expense.splitCount === 1 ? "way" : "ways"}`}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <Link
                    href={`/trips/${tripId}/expenses/${expense.id}/edit`}
                    className="text-sm font-semibold text-primary hover:underline"
                  >
                    Edit
                  </Link>
                  <RemoveExpense tripId={tripId} expenseId={expense.id} title={expense.title} />
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

function BalancePart({
  title,
  lines,
  currentUserId,
  empty,
  verb,
  youVerb,
  direction,
  amountClassName = "text-primary",
}: {
  title: string;
  lines: SettlementSide[];
  currentUserId: string;
  empty: string;
  verb: string;
  youVerb: string;
  direction: "from" | "to";
  amountClassName?: string;
}) {
  const ordered = [...lines].sort((a, b) => {
    if (a.userId === currentUserId) return -1;
    if (b.userId === currentUserId) return 1;
    return a.name.localeCompare(b.name) || a.currency.localeCompare(b.currency);
  });

  return (
    <div className="rounded-xl bg-card p-4">
      <p
        className={cn(
          "text-xs font-bold tracking-widest uppercase",
          amountClassName === "text-primary" ? "text-muted-foreground" : amountClassName,
        )}
      >
        {title}
      </p>
      {ordered.length === 0 ? (
        <p className="mt-2 font-extrabold tracking-tight">{empty}</p>
      ) : (
        <ul className="mt-3 flex flex-col gap-4">
          {ordered.map((line) => {
            const you = line.userId === currentUserId;
            return (
              <li key={`${line.currency}:${line.userId}`}>
                <p className="text-sm">
                  <span className="font-semibold">{you ? "You" : line.name}</span>
                  {` ${you ? youVerb : verb} `}
                  <span className={cn("font-extrabold", amountClassName)}>{formatMoney(line.cents, line.currency)}</span>
                </p>
                <ul className="mt-1 flex flex-col gap-1">
                  {line.with.map((item) => (
                    <li key={item.userId} className="text-sm text-muted-foreground">
                      {direction} {item.userId === currentUserId ? "you" : item.name}{" "}
                      <span className={cn("font-semibold", amountClassName)}>{formatMoney(item.cents, line.currency)}</span>
                    </li>
                  ))}
                </ul>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
