import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { ItinerarySection } from "./itinerary-section";
import { loadItinerary, loadTripShell } from "./trip-data";
import { TripShell } from "./trip-shell";

export default async function TripPage({ params }: PageProps<"/trips/[id]">) {
  const { id } = await params;
  const { supabase } = await requireUser(`/trips/${id}`);
  const { trip, memberCount } = await loadTripShell(supabase, id);
  if (!trip) notFound();

  const [itineraryResult, { data: placeNames }] = await Promise.all([
    loadItinerary(supabase, id),
    supabase.from("places").select("id, name").eq("trip_id", id),
  ]);
  const names = new Map((placeNames ?? []).map((place) => [place.id, place.name]));
  const items = itineraryResult.items.map((item) => ({
    ...item,
    placeName: item.placeId ? (names.get(item.placeId) ?? null) : null,
  }));

  return (
    <TripShell trip={trip} memberCount={memberCount} active="itinerary">
      <ItinerarySection
        tripId={trip.id}
        startDate={trip.start_date}
        endDate={trip.end_date}
        items={items}
        unavailable={itineraryResult.unavailable}
      />
    </TripShell>
  );
}
