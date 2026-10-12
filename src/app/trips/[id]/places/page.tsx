import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { PlacesSection } from "../places-section";
import { loadPlaces, loadTripShell } from "../trip-data";
import { TripShell } from "../trip-shell";

export default async function TripPlacesPage({ params }: PageProps<"/trips/[id]/places">) {
  const { id } = await params;
  const { supabase } = await requireUser(`/trips/${id}/places`);
  const { trip, memberCount } = await loadTripShell(supabase, id);
  if (!trip) notFound();

  const { places, placesUnavailable, detailsMissing, mapMissing } = await loadPlaces(supabase, id);

  return (
    <TripShell trip={trip} memberCount={memberCount} active="places">
      <PlacesSection
        tripId={trip.id}
        places={places}
        unavailable={placesUnavailable}
        detailsMissing={detailsMissing}
        mapMissing={mapMissing}
      />
    </TripShell>
  );
}
