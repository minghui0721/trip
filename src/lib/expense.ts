export const expenseCurrencies = [
  "USD",
  "EUR",
  "GBP",
  "JPY",
  "CNY",
  "HKD",
  "TWD",
  "SGD",
  "MYR",
  "THB",
  "VND",
  "IDR",
  "KRW",
  "AUD",
  "PHP",
] as const;

export type ExpenseCurrency = (typeof expenseCurrencies)[number];

const MAX_CENTS = 999_999_999_99;

export function isExpenseCurrency(value: string): value is ExpenseCurrency {
  return (expenseCurrencies as readonly string[]).includes(value);
}

// "12.50" → 1250. Rejects more than two decimal places and zero.
export function centsFromInput(value: string) {
  const text = value.trim();
  if (!/^\d+(\.\d{1,2})?$/.test(text)) return null;
  const cents = centsFromAmount(text);
  if (cents === null || cents <= 0 || cents > MAX_CENTS) return null;
  return cents;
}

export function centsFromAmount(value: string | number) {
  const text = String(value).trim();
  const match = text.match(/^(-?)(\d+)(?:\.(\d+))?$/);
  if (!match) return null;
  const cents = Number(match[2]) * 100 + Number((match[3] ?? "").padEnd(2, "0").slice(0, 2));
  if (!Number.isSafeInteger(cents)) return null;
  return match[1] === "-" ? -cents : cents;
}

// Convert cents by a units-per-unit rate. Rejects results that do not fit the money limit.
export function convertCents(cents: number, rate: number) {
  if (!Number.isFinite(cents) || cents <= 0 || !Number.isFinite(rate) || rate <= 0) return null;
  const result = Math.round(cents * rate);
  if (!Number.isSafeInteger(result) || result <= 0 || result > MAX_CENTS) return null;
  return result;
}

export function amountFromCents(cents: number) {
  const abs = Math.abs(cents);
  return `${cents < 0 ? "-" : ""}${Math.floor(abs / 100)}.${String(abs % 100).padStart(2, "0")}`;
}

export function formatMoney(cents: number, currency: string) {
  const amount = Number(amountFromCents(cents));
  try {
    return new Intl.NumberFormat("en-GB", { style: "currency", currency }).format(amount);
  } catch {
    return `${amountFromCents(cents)} ${currency}`;
  }
}

// Equal shares. Any leftover cent goes to the earliest people so the parts add up.
export function equalShares(totalCents: number, userIds: string[]) {
  const ordered = [...new Set(userIds)].sort();
  if (ordered.length === 0 || totalCents <= 0) return [];
  const base = Math.floor(totalCents / ordered.length);
  let remainder = totalCents - base * ordered.length;
  return ordered.map((userId) => {
    const extra = remainder > 0 ? 1 : 0;
    remainder -= extra;
    return { userId, cents: base + extra };
  });
}

export function sharesAreEqual(totalCents: number, shares: { userId: string; cents: number }[]) {
  const equal = equalShares(
    totalCents,
    shares.map((share) => share.userId),
  );
  if (equal.length === 0 || equal.length !== shares.length) return false;
  const amounts = new Map(shares.map((share) => [share.userId, share.cents]));
  return equal.every((share) => amounts.get(share.userId) === share.cents);
}

// Spread a leftover amount equally on top of the prices already entered.
export function addEqualRemainder(current: { userId: string; cents: number }[], leftCents: number) {
  if (leftCents <= 0 || current.length === 0) return current;
  const extra = new Map(
    equalShares(
      leftCents,
      current.map((share) => share.userId),
    ).map((share) => [share.userId, share.cents]),
  );
  return current.map((share) => ({
    userId: share.userId,
    cents: share.cents + (extra.get(share.userId) ?? 0),
  }));
}

export type ExpenseTransfer = {
  fromId: string;
  fromName: string;
  toId: string;
  toName: string;
  cents: number;
  currency: string;
};

// Who should pay whom, kept separate for each currency.
export function formatPayerNames(names: string[]) {
  if (names.length === 0) return "Someone";
  if (names.length === 1) return names[0] ?? "Someone";
  if (names.length === 2) return `${names[0]} and ${names[1]}`;
  return `${names.slice(0, -1).join(", ")}, and ${names[names.length - 1]}`;
}

export function settleExpenses(
  rows: {
    currency: string;
    payments: { userId: string; cents: number }[];
    shares: { userId: string; cents: number }[];
  }[],
  names: Map<string, string>,
): ExpenseTransfer[] {
  const nets = new Map<string, Map<string, number>>();
  function add(currency: string, userId: string, cents: number) {
    const byUser = nets.get(currency) ?? new Map<string, number>();
    byUser.set(userId, (byUser.get(userId) ?? 0) + cents);
    nets.set(currency, byUser);
  }

  for (const row of rows) {
    for (const payment of row.payments) add(row.currency, payment.userId, payment.cents);
    for (const share of row.shares) add(row.currency, share.userId, -share.cents);
  }

  const transfers: ExpenseTransfer[] = [];
  for (const [currency, byUser] of nets) {
    const debtors = [...byUser.entries()]
      .filter(([, cents]) => cents < 0)
      .map(([userId, cents]) => ({ userId, cents: -cents }))
      .sort((a, b) => b.cents - a.cents || a.userId.localeCompare(b.userId));
    const creditors = [...byUser.entries()]
      .filter(([, cents]) => cents > 0)
      .map(([userId, cents]) => ({ userId, cents }))
      .sort((a, b) => b.cents - a.cents || a.userId.localeCompare(b.userId));

    let debtor = 0;
    let creditor = 0;
    while (debtor < debtors.length && creditor < creditors.length) {
      const cents = Math.min(debtors[debtor].cents, creditors[creditor].cents);
      if (cents > 0) {
        transfers.push({
          fromId: debtors[debtor].userId,
          fromName: names.get(debtors[debtor].userId) ?? "Someone",
          toId: creditors[creditor].userId,
          toName: names.get(creditors[creditor].userId) ?? "Someone",
          cents,
          currency,
        });
      }
      debtors[debtor].cents -= cents;
      creditors[creditor].cents -= cents;
      if (debtors[debtor].cents === 0) debtor += 1;
      if (creditors[creditor].cents === 0) creditor += 1;
    }
  }
  return transfers;
}

export type SettlementSide = {
  userId: string;
  name: string;
  currency: string;
  cents: number;
  with: { userId: string; name: string; cents: number }[];
};

// What each person receives, and what each person still needs to pay.
export function settlementSides(transfers: ExpenseTransfer[]) {
  return {
    receive: groupSettlement(transfers, "receive"),
    pay: groupSettlement(transfers, "pay"),
  };
}

function groupSettlement(transfers: ExpenseTransfer[], side: "receive" | "pay"): SettlementSide[] {
  const groups = new Map<string, SettlementSide>();
  for (const transfer of transfers) {
    const userId = side === "receive" ? transfer.toId : transfer.fromId;
    const name = side === "receive" ? transfer.toName : transfer.fromName;
    const otherId = side === "receive" ? transfer.fromId : transfer.toId;
    const otherName = side === "receive" ? transfer.fromName : transfer.toName;
    const key = `${transfer.currency}:${userId}`;
    const group = groups.get(key) ?? { userId, name, currency: transfer.currency, cents: 0, with: [] };
    group.cents += transfer.cents;
    group.with.push({ userId: otherId, name: otherName, cents: transfer.cents });
    groups.set(key, group);
  }
  return [...groups.values()]
    .map((group) => ({
      ...group,
      with: group.with.sort((a, b) => b.cents - a.cents || a.name.localeCompare(b.name)),
    }))
    .sort((a, b) => a.name.localeCompare(b.name) || a.currency.localeCompare(b.currency));
}
