import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { isPlaceCategory } from "@/lib/place";
import { EditPlaceForm } from "./edit-place-form";

export default async function EditPlacePage({
  params,
}: PageProps<"/trips/[id]/places/[placeId]/edit">) {
  const { id, placeId } = await params;
  const { supabase } = await requireUser(`/trips/${id}/places/${placeId}/edit`);

  const { data: trip } = await supabase
    .from("trips")
    .select("id, name, destination")
    .eq("id", id)
    .maybeSingle();
  if (!trip) notFound();

  const full = await supabase
    .from("places")
    .select("id, name, category, notes, location, latitude, longitude")
    .eq("id", placeId)
    .eq("trip_id", trip.id)
    .maybeSingle();

  let place = full.data;
  if (full.error && /latitude|longitude/i.test(full.error.message)) {
    const located = await supabase
      .from("places")
      .select("id, name, category, notes, location")
      .eq("id", placeId)
      .eq("trip_id", trip.id)
      .maybeSingle();
    place = located.data ? { ...located.data, latitude: null, longitude: null } : null;
  }
  if (!place || !isPlaceCategory(place.category)) notFound();

  return (
    <div className="flex flex-1 flex-col bg-gradient-to-b from-secondary to-background to-40%">
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-8 px-5 pt-[max(1rem,env(safe-area-inset-top))] pb-12 md:max-w-lg md:pt-12">
        <Link
          href={`/trips/${trip.id}/places`}
          aria-label="Back to the trip"
          className="-ml-1 flex size-9 items-center justify-center rounded-full bg-black/30 transition-colors hover:bg-black/50"
        >
          <ChevronLeft className="size-5" />
        </Link>
        <div>
          <p className="text-sm font-medium text-muted-foreground">{trip.name}</p>
          <h1 className="mt-1 text-4xl font-black tracking-tighter md:text-5xl">Edit place</h1>
        </div>
        <EditPlaceForm
          tripId={trip.id}
          destination={trip.destination}
          place={{
            id: place.id,
            name: place.name,
            category: place.category,
            notes: place.notes,
            location: place.location,
            latitude: place.latitude,
            longitude: place.longitude,
          }}
        />
      </main>
    </div>
  );
}
