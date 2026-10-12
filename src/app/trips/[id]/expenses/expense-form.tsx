"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  addEqualRemainder,
  amountFromCents,
  centsFromInput,
  equalShares,
  expenseCurrencies,
  formatMoney,
  sharesAreEqual,
  type ExpenseCurrency,
} from "@/lib/expense";
import { cn } from "@/lib/utils";
import { createExpense, updateExpense, type ExpenseFormState } from "../../expense-actions";

type Person = { id: string; name: string };

export function ExpenseForm({
  tripId,
  people,
  currentUserId,
  expense,
}: {
  tripId: string;
  people: Person[];
  currentUserId: string;
  expense?: {
    id: string;
    title: string;
    amount: string;
    currency: ExpenseCurrency;
    payerIds: string[];
    spentOn: string;
    shares: { userId: string; cents: number }[];
  };
}) {
  const action = expense ? updateExpense : createExpense;
  const [state, formAction, pending] = useActionState<ExpenseFormState, FormData>(action, {});
  const [amount, setAmount] = useState(expense?.amount ?? "");
  const [currency, setCurrency] = useState<ExpenseCurrency>(expense?.currency ?? "USD");
  const [payerId, setPayerId] = useState(() => {
    const saved = expense?.payerIds.find((id) => people.some((person) => person.id === id));
    if (saved) return saved;
    if (people.some((person) => person.id === currentUserId)) return currentUserId;
    return people[0]?.id ?? "";
  });
  const savedShares =
    expense?.shares.filter((share) => people.some((person) => person.id === share.userId)) ?? [];
  const savedCents = expense ? centsFromInput(expense.amount) : null;
  const [equalSplit, setEqualSplit] = useState(
    () => !savedCents || savedShares.length === 0 || sharesAreEqual(savedCents, savedShares),
  );
  const [splitIds, setSplitIds] = useState<string[]>(() => {
    if (savedShares.length === 0) return people.map((person) => person.id);
    const savedIds = new Set(savedShares.map((share) => share.userId));
    return people.map((person) => person.id).filter((id) => savedIds.has(id));
  });
  const [shareAmounts, setShareAmounts] = useState<Record<string, string>>(() =>
    savedCents && savedShares.length > 0 && !sharesAreEqual(savedCents, savedShares)
      ? Object.fromEntries(savedShares.map((share) => [share.userId, amountFromCents(share.cents)]))
      : {},
  );

  const cents = centsFromInput(amount);
  const shares = cents ? equalShares(cents, splitIds) : [];
  const sharesEven = shares.length > 0 && shares.every((share) => share.cents === shares[0]?.cents);
  const shareStatus = customShareStatus(cents, splitIds, shareAmounts);

  function chooseSplit(equal: boolean) {
    if (equal) {
      setEqualSplit(true);
      return;
    }
    if (equalSplit) turnOffEqualSplit();
  }

  function toggleSplit(id: string) {
    const selected = splitIds.includes(id);
    setSplitIds(selected ? splitIds.filter((item) => item !== id) : [...splitIds, id]);
    setShareAmounts((amounts) => {
      if (selected) {
        const next = { ...amounts };
        delete next[id];
        return next;
      }
      return { ...amounts, [id]: amounts[id] ?? "" };
    });
  }

  function turnOffEqualSplit() {
    if (cents) {
      setShareAmounts(Object.fromEntries(shares.map((share) => [share.userId, amountFromCents(share.cents)])));
    }
    setEqualSplit(false);
  }

  function splitWhatsLeft() {
    if (!cents || shareStatus.kind !== "left") return;
    const current = splitIds.map((id) => {
      const text = shareAmounts[id]?.trim() ?? "";
      return { userId: id, cents: text ? (centsFromInput(text) ?? 0) : 0 };
    });
    const next = addEqualRemainder(current, shareStatus.cents);
    setShareAmounts(Object.fromEntries(next.map((share) => [share.userId, amountFromCents(share.cents)])));
  }

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <input type="hidden" name="trip_id" value={tripId} />
      {expense && <input type="hidden" name="expense_id" value={expense.id} />}
      <div className="flex flex-col gap-2">
        <Label className="font-bold" htmlFor="title">What was it for?</Label>
        <Input
          id="title"
          name="title"
          defaultValue={expense?.title ?? ""}
          placeholder="Dinner"
          required
          maxLength={100}
          className="h-12 rounded-md bg-input px-3 text-base"
        />
      </div>
      <div className="grid grid-cols-[1fr_7.5rem] gap-3">
        <div className="flex flex-col gap-2">
          <Label className="font-bold" htmlFor="amount">Amount</Label>
          <Input
            id="amount"
            name="amount"
            inputMode="decimal"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            placeholder="120.00"
            required
            className="h-12 rounded-md bg-input px-3 text-base"
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label className="font-bold" htmlFor="currency">Currency</Label>
          <select
            id="currency"
            name="currency"
            value={currency}
            onChange={(event) => setCurrency(event.target.value as ExpenseCurrency)}
            className="h-12 rounded-md bg-input px-3 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            {expenseCurrencies.map((code) => (
              <option key={code} value={code}>{code}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Label className="font-bold" htmlFor="spent_on">Date (optional)</Label>
        <Input
          id="spent_on"
          name="spent_on"
          type="date"
          defaultValue={expense?.spentOn ?? ""}
          className="h-12 rounded-md bg-input px-3 text-base"
        />
      </div>
      <fieldset className="flex flex-col gap-2">
        <legend className="font-bold">Who paid?</legend>
        <div className="flex flex-wrap gap-2">
          {people.map((person) => (
            <label
              key={person.id}
              className={cn(
                "cursor-pointer rounded-full bg-card px-4 py-2 text-sm font-semibold",
                "has-[:checked]:bg-primary has-[:checked]:text-primary-foreground",
              )}
            >
              <input
                type="radio"
                name="payer"
                value={person.id}
                checked={payerId === person.id}
                onChange={() => setPayerId(person.id)}
                className="sr-only"
              />
              {person.name}
            </label>
          ))}
        </div>
      </fieldset>
      <fieldset className="flex flex-col gap-2">
        <legend className="font-bold">Split</legend>
        <input type="hidden" name="split_mode" value={equalSplit ? "equal" : "custom"} />
        <button
          type="button"
          aria-pressed={equalSplit}
          onClick={() => chooseSplit(true)}
          className={cn(
            "flex h-12 w-full cursor-pointer items-center rounded-xl bg-card px-4 text-left text-sm font-semibold",
            equalSplit && "bg-primary text-primary-foreground",
          )}
        >
          Split equally
        </button>
        <button
          type="button"
          aria-pressed={!equalSplit}
          onClick={() => chooseSplit(false)}
          className={cn(
            "flex h-12 w-full cursor-pointer items-center rounded-xl bg-card px-4 text-left text-sm font-semibold",
            !equalSplit && "bg-primary text-primary-foreground",
          )}
        >
          Different prices
        </button>
      </fieldset>
      <fieldset className="flex flex-col gap-2">
        <legend className="font-bold">Who shares it?</legend>
        {equalSplit ? (
          <>
            <div className="flex flex-wrap gap-2">
              {people.map((person) => (
                <label
                  key={person.id}
                  className={cn(
                    "cursor-pointer rounded-full bg-card px-4 py-2 text-sm font-semibold",
                    "has-[:checked]:bg-primary has-[:checked]:text-primary-foreground",
                  )}
                >
                  <input
                    type="checkbox"
                    name="split"
                    value={person.id}
                    checked={splitIds.includes(person.id)}
                    onChange={() => toggleSplit(person.id)}
                    className="sr-only"
                  />
                  {person.name}
                </label>
              ))}
            </div>
            {shares.length > 0 && sharesEven && shares[0] && (
              <p className="text-sm text-muted-foreground">
                Split equally, {formatMoney(shares[0].cents, currency)} each.
              </p>
            )}
            {shares.length > 0 && !sharesEven && (
              <ul className="text-sm text-muted-foreground">
                {shares.map((share) => (
                  <li key={share.userId}>
                    {people.find((person) => person.id === share.userId)?.name}: {formatMoney(share.cents, currency)}
                  </li>
                ))}
              </ul>
            )}
          </>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              Enter each person&apos;s price. The prices have to add up to the amount.
            </p>
            <div className="flex flex-col gap-2">
              {people.map((person) => {
                const checked = splitIds.includes(person.id);
                return (
                  <div key={person.id} className="flex items-center gap-3">
                    <label
                      className={cn(
                        "min-w-0 flex-1 cursor-pointer truncate rounded-full bg-card px-4 py-2 text-sm font-semibold",
                        "has-[:checked]:bg-primary has-[:checked]:text-primary-foreground",
                      )}
                    >
                      <input
                        type="checkbox"
                        name="split"
                        value={person.id}
                        checked={checked}
                        onChange={() => toggleSplit(person.id)}
                        className="sr-only"
                      />
                      {person.name}
                    </label>
                    {checked && (
                      <Input
                        name={`share_${person.id}`}
                        inputMode="decimal"
                        value={shareAmounts[person.id] ?? ""}
                        onChange={(event) =>
                          setShareAmounts((current) => ({ ...current, [person.id]: event.target.value }))
                        }
                        placeholder="0.00"
                        aria-label={`${person.name}'s price`}
                        className="h-12 w-32 shrink-0 rounded-md bg-input px-3 text-base"
                      />
                    )}
                  </div>
                );
              })}
            </div>
            {shareStatus.kind === "need-amount" && (
              <p className="text-sm text-muted-foreground">Enter the amount first.</p>
            )}
            {shareStatus.kind === "nobody" && (
              <p className="text-sm text-muted-foreground">Choose who shares this.</p>
            )}
            {shareStatus.kind === "blank" && (
              <p className="text-sm text-muted-foreground">Enter each person&apos;s price.</p>
            )}
            {shareStatus.kind === "invalid" && (
              <p className="text-sm text-muted-foreground">
                Use a price greater than zero, with up to two decimal places.
              </p>
            )}
            {shareStatus.kind === "left" && (
              <div className="flex flex-wrap items-center gap-3">
                <p className="text-sm text-muted-foreground">
                  {formatMoney(shareStatus.cents, currency)} still to assign.
                </p>
                <Button type="button" variant="secondary" onClick={splitWhatsLeft}>
                  Split what&apos;s left
                </Button>
              </div>
            )}
            {shareStatus.kind === "over" && (
              <p className="text-sm text-destructive">Over by {formatMoney(shareStatus.cents, currency)}.</p>
            )}
            {shareStatus.kind === "match" && (
              <p className="text-sm text-muted-foreground">Prices match the amount.</p>
            )}
          </>
        )}
      </fieldset>
      {state.error && (
        <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{state.error}</p>
      )}
      <Button
        type="submit"
        size="lg"
        className="mt-2 h-12 text-base"
        disabled={pending || (!equalSplit && shareStatus.kind !== "match")}
      >
        {pending ? "Saving…" : expense ? "Save" : "Add expense"}
      </Button>
    </form>
  );
}

function customShareStatus(
  totalCents: number | null,
  splitIds: string[],
  shareAmounts: Record<string, string>,
):
  | { kind: "need-amount" }
  | { kind: "nobody" }
  | { kind: "blank" }
  | { kind: "invalid" }
  | { kind: "left"; cents: number }
  | { kind: "over"; cents: number }
  | { kind: "match" } {
  if (totalCents === null) return { kind: "need-amount" };
  if (splitIds.length === 0) return { kind: "nobody" };

  let used = 0;
  let empty = false;
  for (const id of splitIds) {
    const text = (shareAmounts[id] ?? "").trim();
    if (!text) {
      empty = true;
      continue;
    }
    const value = centsFromInput(text);
    if (value === null) return { kind: "invalid" };
    used += value;
  }

  const left = totalCents - used;
  if (left < 0) return { kind: "over", cents: -left };
  if (left === 0 && empty) return { kind: "blank" };
  if (left === 0) return { kind: "match" };
  return { kind: "left", cents: left };
}
