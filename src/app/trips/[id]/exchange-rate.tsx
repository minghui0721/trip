"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { expenseCurrencies, formatMoney, isExpenseCurrency, type ExpenseCurrency } from "@/lib/expense";

type Quote = {
  from: ExpenseCurrency;
  to: ExpenseCurrency;
  cents: number;
  resultCents: number;
  rate: number;
  updated: string | null;
};

export function ExchangeRate() {
  const [amount, setAmount] = useState("100");
  const [from, setFrom] = useState<ExpenseCurrency>("USD");
  const [to, setTo] = useState<ExpenseCurrency>("MYR");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [quote, setQuote] = useState<Quote | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      const params = new URLSearchParams({ amount, from, to });
      const response = await fetch(`/api/exchange?${params}`);
      const body = (await response.json()) as Partial<Quote> & { error?: string };
      if (!response.ok || !isQuote(body)) {
        setQuote(null);
        setError(body.error ?? "Couldn't load today's rate.");
        return;
      }
      setQuote(body);
    } catch {
      setQuote(null);
      setError("Couldn't load today's rate.");
    } finally {
      setPending(false);
    }
  }

  const updated = quote ? formatUpdated(quote.updated) : null;

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3 rounded-xl bg-card p-4">
      <p className="text-xs font-bold tracking-widest text-muted-foreground uppercase">Exchange rate</p>
      <div className="flex flex-col gap-2">
        <Label className="font-bold" htmlFor="exchange-amount">Amount</Label>
        <Input
          id="exchange-amount"
          inputMode="decimal"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          placeholder="100.00"
          required
          className="h-12 rounded-md bg-input px-3 text-base"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-2">
          <Label className="font-bold" htmlFor="exchange-from">From</Label>
          <CurrencySelect id="exchange-from" value={from} onChange={setFrom} />
        </div>
        <div className="flex flex-col gap-2">
          <Label className="font-bold" htmlFor="exchange-to">To</Label>
          <CurrencySelect id="exchange-to" value={to} onChange={setTo} />
        </div>
      </div>
      <Button type="submit" className="h-12 text-base" disabled={pending}>
        {pending ? "Checking…" : "Check rate"}
      </Button>
      {error && <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
      {quote && (
        <div className="text-sm">
          <p>
            <span className="font-semibold">{formatMoney(quote.cents, quote.from)}</span>
            {" is about "}
            <span className="font-extrabold text-primary">{formatMoney(quote.resultCents, quote.to)}</span>
          </p>
          <p className="mt-1 text-muted-foreground">
            1 {quote.from} = {formatRate(quote.rate)} {quote.to}
            {updated ? ` · ${updated}` : ""}
          </p>
        </div>
      )}
    </form>
  );
}

function CurrencySelect({
  id,
  value,
  onChange,
}: {
  id: string;
  value: ExpenseCurrency;
  onChange: (currency: ExpenseCurrency) => void;
}) {
  return (
    <select
      id={id}
      value={value}
      onChange={(event) => {
        if (isExpenseCurrency(event.target.value)) onChange(event.target.value);
      }}
      className="h-12 rounded-md bg-input px-3 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      {expenseCurrencies.map((code) => (
        <option key={code} value={code}>{code}</option>
      ))}
    </select>
  );
}

function isQuote(value: Partial<Quote>): value is Quote {
  return (
    isExpenseCurrency(value.from ?? "") &&
    isExpenseCurrency(value.to ?? "") &&
    typeof value.cents === "number" &&
    typeof value.resultCents === "number" &&
    typeof value.rate === "number" &&
    (typeof value.updated === "string" || value.updated === null)
  );
}

function formatRate(rate: number) {
  if (rate >= 100) return rate.toLocaleString("en-GB", { maximumFractionDigits: 2 });
  if (rate >= 1) return rate.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 4 });
  return rate.toLocaleString("en-GB", { maximumSignificantDigits: 4 });
}

function formatUpdated(value: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}
