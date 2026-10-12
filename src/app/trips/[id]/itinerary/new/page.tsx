import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { isIsoDate } from "@/lib/itinerary";
import { ItineraryForm } from "../itinerary-form";

export default async function NewItineraryPage({
  params,
  searchParams,
}: PageProps<"/trips/[id]/itinerary/new">) {
  const { id } = await params;
  const { day } = await searchParams;
  const { supabase } = await requireUser(`/trips/${id}/itinerary/new`);

  const { data: trip } = await supabase
    .from("trips")
    .select("id, name, start_date")
    .eq("id", id)
    .maybeSingle();
  if (!trip) notFound();

  const { data: places } = await supabase
    .from("places")
    .select("id, name")
    .eq("trip_id", trip.id)
    .order("name");

  const requested = typeof day === "string" ? day : "";
  const defaultDay = isIsoDate(requested) ? requested : (trip.start_date ?? "");

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
          <h1 className="mt-1 text-4xl font-black tracking-tighter md:text-5xl">Add to the plan</h1>
        </div>
        <ItineraryForm
          tripId={trip.id}
          places={places ?? []}
          defaultDay={defaultDay}
        />
      </main>
    </div>
  );
}
