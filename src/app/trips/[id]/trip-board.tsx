import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { formatPayerNames, settlementSides, settleExpenses } from "@/lib/expense";
import { ExpensesSection, type TripExpense } from "./expenses-section";
import { ItinerarySection } from "./itinerary-section";
import { PlacesSection } from "./places-section";
import { loadExpenses, loadItinerary, loadPlaces, loadTripShell } from "./trip-data";
import { TripShell } from "./trip-shell";
import { TripTabs, type TripSection } from "./trip-tabs";

// One load for the whole trip. The tabs then switch on the phone.
export async function TripBoard({ tripId, tab }: { tripId: string; tab: TripSection }) {
  const { supabase, user } = await requireUser(
    tab === "itinerary" ? `/trips/${tripId}` : `/trips/${tripId}/${tab}`,
  );
  const [shell, itineraryResult, placeResult, expenseResult, { data: members }, { data: placeNames }] =
    await Promise.all([
      loadTripShell(supabase, tripId),
      loadItinerary(supabase, tripId),
      loadPlaces(supabase, tripId),
      loadExpenses(supabase, tripId),
      supabase.from("trip_members").select("user_id, profiles(display_name)").eq("trip_id", tripId),
      supabase.from("places").select("id, name").eq("trip_id", tripId),
    ]);
  if (!shell.trip) notFound();

  const names = new Map(
    (members ?? []).map((member) => [member.user_id, member.profiles?.display_name ?? "Someone"]),
  );
  const placeNameById = new Map((placeNames ?? []).map((place) => [place.id, place.name]));
  const items = itineraryResult.items.map((item) => ({
    ...item,
    placeName: item.placeId ? (placeNameById.get(item.placeId) ?? null) : null,
  }));
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
    <TripShell trip={shell.trip} memberCount={shell.memberCount} active={tab} showTabs={false}>
      <TripTabs
        tripId={shell.trip.id}
        initial={tab}
        itinerary={
          <ItinerarySection
            tripId={shell.trip.id}
            startDate={shell.trip.start_date}
            endDate={shell.trip.end_date}
            items={items}
            unavailable={itineraryResult.unavailable}
          />
        }
        places={
          <PlacesSection
            tripId={shell.trip.id}
            places={placeResult.places}
            unavailable={placeResult.placesUnavailable}
            detailsMissing={placeResult.detailsMissing}
            mapMissing={placeResult.mapMissing}
          />
        }
        expenses={
          <ExpensesSection
            tripId={shell.trip.id}
            expenses={expenses}
            balances={balances}
            currentUserId={user.id}
            unavailable={expenseResult.unavailable}
          />
        }
      />
    </TripShell>
  );
}
