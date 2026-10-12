import { NextResponse, type NextRequest } from "next/server";
import { centsFromInput, convertCents, isExpenseCurrency } from "@/lib/expense";
import { createClient } from "@/lib/supabase/server";

// Today's published rates. Lookup only: nothing here is saved onto an expense.
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const from = request.nextUrl.searchParams.get("from") ?? "";
  const to = request.nextUrl.searchParams.get("to") ?? "";
  const cents = centsFromInput(request.nextUrl.searchParams.get("amount") ?? "");
  if (!isExpenseCurrency(from) || !isExpenseCurrency(to)) {
    return NextResponse.json({ error: "Pick two currencies." }, { status: 400 });
  }
  if (cents === null) {
    return NextResponse.json(
      { error: "Enter an amount greater than zero, with up to two decimal places." },
      { status: 400 },
    );
  }
  if (from === to) {
    return NextResponse.json({ from, to, cents, resultCents: cents, rate: 1, updated: null });
  }

  const response = await fetch("https://open.er-api.com/v6/latest/USD", { cache: "no-store" });
  if (!response.ok) return NextResponse.json({ error: "Couldn't load today's rate." }, { status: 502 });

  const body = (await response.json()) as {
    rates?: Record<string, number>;
    time_last_update_utc?: string;
  };
  const fromRate = Number(body.rates?.[from]);
  const toRate = Number(body.rates?.[to]);
  if (!Number.isFinite(fromRate) || fromRate <= 0 || !Number.isFinite(toRate) || toRate <= 0) {
    return NextResponse.json({ error: "This pair isn't available right now." }, { status: 404 });
  }

  const rate = toRate / fromRate;
  const resultCents = convertCents(cents, rate);
  if (resultCents === null) {
    return NextResponse.json({ error: "That amount is too large to convert." }, { status: 400 });
  }

  return NextResponse.json({
    from,
    to,
    cents,
    resultCents,
    rate,
    updated: typeof body.time_last_update_utc === "string" ? body.time_last_update_utc : null,
  });
}
