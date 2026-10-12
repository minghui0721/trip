import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { formatTime } from "@/lib/itinerary";
import { ItineraryForm } from "../../itinerary-form";

export default async function EditItineraryPage({
  params,
}: PageProps<"/trips/[id]/itinerary/[itemId]/edit">) {
  const { id, itemId } = await params;
  const { supabase } = await requireUser(`/trips/${id}/itinerary/${itemId}/edit`);

  const { data: trip } = await supabase
    .from("trips")
    .select("id, name")
    .eq("id", id)
    .maybeSingle();
  if (!trip) notFound();

  const [{ data: item }, { data: places }] = await Promise.all([
    supabase
      .from("itinerary_items")
      .select("id, day, starts_at, title, notes, place_id")
      .eq("id", itemId)
      .eq("trip_id", trip.id)
      .maybeSingle(),
    supabase.from("places").select("id, name").eq("trip_id", trip.id).order("name"),
  ]);
  if (!item) notFound();

  return (
    <div className="flex flex-1 flex-col bg-gradient-to-b from-secondary to-background to-40%">
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col gap-8 px-5 pt-[max(1rem,env(safe-area-inset-top))] pb-12 md:max-w-lg md:pt-12">
        <Link
          href={`/trips/${trip.id}`}
          aria-label="Back to the trip"
          className="-ml-1 flex size-9 items-center justify-center rounded-full bg-black/30 transition-colors hover:bg-black/50"
        >
          <ChevronLeft className="size-5" />
        </Link>
        <div>
          <p className="text-sm font-medium text-muted-foreground">{trip.name}</p>
          <h1 className="mt-1 text-4xl font-black tracking-tighter md:text-5xl">Edit the plan</h1>
        </div>
        <ItineraryForm
          tripId={trip.id}
          places={places ?? []}
          defaultDay={item.day}
          item={{
            id: item.id,
            day: item.day,
            startsAt: item.starts_at ? formatTime(item.starts_at) : "",
            title: item.title,
            notes: item.notes ?? "",
            placeId: item.place_id ?? "",
          }}
        />
      </main>
    </div>
  );
}
