"use client";

import { useState } from "react";
import Link from "next/link";
import { MapPin } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import {
  placeCategoryLabel,
  placeLocationLabel,
  placeMapHref,
  placeStatusGroupLabel,
  placeStatusLabel,
  placeStatuses,
  type PlaceCategory,
  type PlaceStatus,
} from "@/lib/place";
import { cn } from "@/lib/utils";
import { setPlaceStatus } from "../place-actions";
import { AddPanel } from "./add-panel";
import { AddPlaceForm } from "./places/new/add-place-form";
import { PlaceMapStill } from "./place-map-still";
import { PlacePhotos, type PlacePhoto } from "./place-photos";
import { RemovePlace } from "./remove-place";

export type TripPlace = {
  id: string;
  name: string;
  category: PlaceCategory;
  status: PlaceStatus;
  notes: string | null;
  location: string | null;
  latitude: number | null;
  longitude: number | null;
  photos: PlacePhoto[];
};

export function PlacesSection({
  tripId,
  destination,
  places,
  unavailable,
  detailsMissing,
  mapMissing,
}: {
  tripId: string;
  destination: string | null;
  places: TripPlace[];
  unavailable?: "missing" | "failed";
  detailsMissing?: boolean;
  mapMissing?: boolean;
}) {
  const [adding, setAdding] = useState(false);

  if (adding) {
    return (
      <AddPanel title="Add a place" onBack={() => setAdding(false)}>
        <AddPlaceForm tripId={tripId} destination={destination} onDone={() => setAdding(false)} />
      </AddPanel>
    );
  }

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-extrabold tracking-tight">Places</h2>
        {!unavailable && (
          <button type="button" onClick={() => setAdding(true)} className={cn(buttonVariants(), "h-10 px-4")}>
            Add a place
          </button>
        )}
      </div>
      {detailsMissing && (
        <p className="text-sm text-muted-foreground">
          Location and photos aren&apos;t in the database yet. Run
          supabase/migrations/0004_v1_place_details.sql in the Supabase SQL Editor, then reload.
        </p>
      )}
      {mapMissing && !detailsMissing && (
        <p className="text-sm text-muted-foreground">
          Map pins aren&apos;t in the database yet. Run supabase/migrations/0005_v1_place_map.sql in
          the Supabase SQL Editor, then reload.
        </p>
      )}

      {unavailable === "missing" && (
        <p className="text-sm text-muted-foreground">
          Places aren&apos;t in the database yet. Run supabase/migrations/0003_v1_places.sql in the
          Supabase SQL Editor, then reload this page.
        </p>
      )}
      {unavailable === "failed" && (
        <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          Couldn&apos;t load places. Check your connection and try again.
        </p>
      )}
      {!unavailable && places.length === 0 && (
        <div className="rounded-2xl bg-card px-6 py-10 text-center">
          <p className="text-lg font-extrabold tracking-tight">No places yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Add a restaurant, a stay, or something you want to see.
          </p>
        </div>
      )}
      {!unavailable && places.length > 0 && (
        <div className="flex flex-col gap-6">
          {placeStatuses.map((status) => {
            const group = places.filter((place) => place.status === status);
            if (group.length === 0) return null;
            return (
              <div key={status} className="flex flex-col gap-3">
                <h3 className="text-sm font-bold tracking-widest text-muted-foreground uppercase">
                  {placeStatusGroupLabel[status]}
                </h3>
                <ul className="flex flex-col gap-3 md:grid md:grid-cols-2">
                  {group.map((place) => (
                    <PlaceCard key={place.id} tripId={tripId} place={place} photosEnabled={!detailsMissing} />
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function PlaceCard({
  tripId,
  place,
  photosEnabled,
}: {
  tripId: string;
  place: TripPlace;
  photosEnabled: boolean;
}) {
  return (
    <li className="flex flex-col gap-3 rounded-xl bg-card p-4">
      <div>
        <p className="text-xs font-bold tracking-widest text-muted-foreground uppercase">
          {placeCategoryLabel[place.category]}
        </p>
        <p className="mt-1 text-lg font-extrabold tracking-tight">{place.name}</p>
        {place.location && (
          <a
            href={placeMapHref(place.location, place.latitude, place.longitude)}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-1 flex items-start gap-1.5 text-sm text-primary hover:underline"
          >
            <MapPin className="mt-0.5 size-4 shrink-0" />
            <span className="break-words">{placeLocationLabel(place.location)}</span>
          </a>
        )}
        {place.notes && <p className="mt-1 line-clamp-3 text-sm text-muted-foreground">{place.notes}</p>}
      </div>
      {place.latitude !== null && place.longitude !== null && (
        <PlaceMapStill latitude={place.latitude} longitude={place.longitude} />
      )}
      {photosEnabled && <PlacePhotos tripId={tripId} placeId={place.id} photos={place.photos} />}
      <form action={setPlaceStatus} className="flex flex-wrap gap-2">
        <input type="hidden" name="trip_id" value={tripId} />
        <input type="hidden" name="place_id" value={place.id} />
        {placeStatuses.map((status) => (
          <button
            key={status}
            type="submit"
            name="status"
            value={status}
            className={cn(
              "cursor-pointer rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
              place.status === status
                ? "bg-primary text-primary-foreground hover:bg-[color-mix(in_oklch,var(--primary),white_22%)]"
                : "bg-background text-muted-foreground hover:bg-white/10 hover:text-foreground",
            )}
          >
            {placeStatusLabel[status]}
          </button>
        ))}
      </form>
      <div className="flex items-center gap-4">
        <Link href={`/trips/${tripId}/places/${place.id}/edit`} className="text-sm font-semibold text-primary hover:underline">
          Edit
        </Link>
        <RemovePlace tripId={tripId} placeId={place.id} placeName={place.name} />
      </div>
    </li>
  );
}
