"use client";

import { useEffect, useState } from "react";
import { ArrowLeftRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  centsFromInput,
  expenseCurrencies,
  formatMoney,
  isExpenseCurrency,
  type ExpenseCurrency,
} from "@/lib/expense";

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
  const [pending, setPending] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quote, setQuote] = useState<Quote | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => {
      const cents = centsFromInput(amount);
      const text = amount.trim();
      if (cents === null) {
        setPending(false);
        if (text === "" || text.endsWith(".")) {
          if (text === "") setQuote(null);
          setError(null);
          return;
        }
        setQuote(null);
        setError("Enter an amount greater than zero, with up to two decimal places.");
        return;
      }

      setPending(true);
      setError(null);
      const params = new URLSearchParams({ amount: amount.trim(), from, to });
      fetch(`/api/exchange?${params}`, { signal: controller.signal })
        .then(async (response) => {
          const body = (await response.json()) as Partial<Quote> & { error?: string };
          if (!response.ok || !isQuote(body)) {
            setQuote(null);
            setError(body.error ?? "Couldn't load today's rate.");
            return;
          }
          setQuote(body);
        })
        .catch((caught: unknown) => {
          if (caught instanceof DOMException && caught.name === "AbortError") return;
          setQuote(null);
          setError("Couldn't load today's rate.");
        })
        .finally(() => {
          if (!controller.signal.aborted) setPending(false);
        });
    }, 300);

    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [amount, from, to]);

  const updated = quote ? formatUpdated(quote.updated) : null;

  function swapCurrencies() {
    setFrom(to);
    setTo(from);
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-2xl bg-[oklch(0.36_0_0)] px-5 py-6">
        <p className="text-xs font-bold tracking-widest text-muted-foreground uppercase">About</p>
        <p className={`mt-1 text-4xl font-black tracking-tighter ${quote ? "text-primary" : "text-muted-foreground"}`}>
          {quote ? formatMoney(quote.resultCents, quote.to) : pending ? "Checking…" : "—"}
        </p>
        {quote && (
          <p className="mt-3 text-sm text-muted-foreground">
            {formatMoney(quote.cents, quote.from)}
            {" · "}
            1 {quote.from} = {formatRate(quote.rate)} {quote.to}
            {updated ? ` · ${updated}` : ""}
          </p>
        )}
        {error && <p className="mt-3 text-sm text-destructive">{error}</p>}
      </div>
      <div className="flex flex-col gap-2">
        <Label className="font-bold" htmlFor="exchange-amount">Amount</Label>
        <Input
          id="exchange-amount"
          inputMode="decimal"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          placeholder="100.00"
          className="h-12 rounded-md bg-[oklch(0.36_0_0)] px-3 text-base"
        />
      </div>
      <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-2">
        <div className="flex flex-col gap-2">
          <Label className="font-bold" htmlFor="exchange-from">From</Label>
          <CurrencySelect id="exchange-from" value={from} onChange={setFrom} />
        </div>
        <Button
          type="button"
          variant="secondary"
          size="icon-lg"
          aria-label="Swap currencies"
          onClick={swapCurrencies}
          className="size-12"
        >
          <ArrowLeftRight className="size-5" />
        </Button>
        <div className="flex flex-col gap-2">
          <Label className="font-bold" htmlFor="exchange-to">To</Label>
          <CurrencySelect id="exchange-to" value={to} onChange={setTo} />
        </div>
      </div>
    </div>
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
      className="h-12 rounded-md bg-[oklch(0.36_0_0)] px-3 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
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
