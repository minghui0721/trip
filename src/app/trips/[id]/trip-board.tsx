import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { formatPayerNames, settlementSides, settleExpenses } from "@/lib/expense";
import { ExpensesSection, type TripExpense } from "./expenses-section";
import { ItinerarySection } from "./itinerary-section";
import { type TripMember } from "./people-panel";
import { PlacesSection } from "./places-section";
import { loadExpenses, loadItinerary, loadPlaces, loadTripShell } from "./trip-data";
import { TripScreen } from "./trip-screen";
import { type TripSection } from "./trip-tabs";

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
      supabase
        .from("trip_members")
        .select("user_id, role, profiles(display_name, avatar_url)")
        .eq("trip_id", tripId)
        .order("joined_at"),
      supabase.from("places").select("id, name").eq("trip_id", tripId),
    ]);
  if (!shell.trip) notFound();

  const people: TripMember[] = (members ?? []).map((member) => ({
    id: member.user_id,
    name: member.profiles?.display_name ?? "Someone",
    avatarUrl: member.profiles?.avatar_url ?? null,
    role: member.role,
  }));
  const names = new Map(people.map((person) => [person.id, person.name]));
  const placeOptions = placeResult.places
    .map((place) => ({ id: place.id, name: place.name }))
    .sort((a, b) => a.name.localeCompare(b.name));
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
    <TripScreen
      trip={shell.trip}
      members={people}
      canEdit={people.some((person) => person.id === user.id && person.role === "owner")}
      initial={tab}
      itinerary={
          <ItinerarySection
            tripId={shell.trip.id}
            startDate={shell.trip.start_date}
            endDate={shell.trip.end_date}
            items={items}
            places={placeOptions}
            unavailable={itineraryResult.unavailable}
          />
        }
        places={
          <PlacesSection
            tripId={shell.trip.id}
            destination={shell.trip.destination}
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
            people={people}
            currentUserId={user.id}
            unavailable={expenseResult.unavailable}
          />
        }
    />
  );
}
