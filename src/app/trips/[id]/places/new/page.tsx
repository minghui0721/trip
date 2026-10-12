import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { requireUser } from "@/lib/auth";
import { AddPlaceForm } from "./add-place-form";

export default async function NewPlacePage({ params }: PageProps<"/trips/[id]/places/new">) {
  const { id } = await params;
  const { supabase } = await requireUser(`/trips/${id}/places/new`);

  const { data: trip } = await supabase
    .from("trips")
    .select("id, name, destination")
    .eq("id", id)
    .maybeSingle();
  if (!trip) notFound();

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
          <h1 className="mt-1 text-4xl font-black tracking-tighter md:text-5xl">Add a place</h1>
        </div>
        <AddPlaceForm tripId={trip.id} destination={trip.destination} />
      </main>
    </div>
  );
}
