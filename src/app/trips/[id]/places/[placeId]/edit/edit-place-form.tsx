"use client";

import { useActionState, useState } from "react";
import dynamic from "next/dynamic";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { placeCategories, placeCategoryLabel, type PlaceCategory } from "@/lib/place";
import { cn } from "@/lib/utils";
import { updatePlace } from "../../../../place-actions";
import type { MapPinValue } from "../../new/place-picker";

const PlacePicker = dynamic(
  () => import("../../new/place-picker").then((mod) => mod.PlacePicker),
  { ssr: false, loading: () => <div className="h-64 rounded-xl bg-card" /> },
);

export function EditPlaceForm({
  tripId,
  destination,
  place,
}: {
  tripId: string;
  destination: string | null;
  place: {
    id: string;
    name: string;
    category: PlaceCategory;
    notes: string | null;
    location: string | null;
    latitude: number | null;
    longitude: number | null;
  };
}) {
  const [state, action, pending] = useActionState(updatePlace, {});
  const [location, setLocation] = useState(place.location ?? "");
  const [latitude, setLatitude] = useState<number | null>(place.latitude);
  const [longitude, setLongitude] = useState<number | null>(place.longitude);
  const pin =
    latitude !== null && longitude !== null ? { latitude, longitude } : null;

  function onPin(next: MapPinValue) {
    setLatitude(next.latitude);
    setLongitude(next.longitude);
    if (next.label) setLocation(next.label);
  }

  return (
    <form action={action} className="flex flex-col gap-5">
      <input type="hidden" name="trip_id" value={tripId} />
      <input type="hidden" name="place_id" value={place.id} />
      <input type="hidden" name="latitude" value={latitude ?? ""} />
      <input type="hidden" name="longitude" value={longitude ?? ""} />
      <div className="flex flex-col gap-2">
        <Label className="font-bold" htmlFor="name">Name</Label>
        <Input
          id="name"
          name="name"
          defaultValue={place.name}
          required
          maxLength={100}
          className="h-12 rounded-md bg-input px-3 text-base"
        />
      </div>
      <fieldset className="flex flex-col gap-2">
        <legend className="font-bold">Category</legend>
        <div className="flex flex-wrap gap-2">
          {placeCategories.map((category) => (
            <label
              key={category}
              className={cn(
                "cursor-pointer rounded-full bg-card px-4 py-2 text-sm font-semibold",
                "has-[:checked]:bg-primary has-[:checked]:text-primary-foreground",
              )}
            >
              <input
                type="radio"
                name="category"
                value={category}
                defaultChecked={category === place.category}
                required
                className="sr-only"
              />
              {placeCategoryLabel[category]}
            </label>
          ))}
        </div>
      </fieldset>
      <PlacePicker destination={destination} pin={pin} onChange={onPin} />
      <div className="flex flex-col gap-2">
        <Label className="font-bold" htmlFor="location">Location (optional)</Label>
        <Input
          id="location"
          name="location"
          value={location}
          onChange={(event) => setLocation(event.target.value)}
          placeholder="Street address, or drop a pin above"
          maxLength={500}
          className="h-12 rounded-md bg-input px-3 text-base"
        />
        <p className="text-sm text-muted-foreground">Move the pin to change the spot. You can shorten the address.</p>
      </div>
      <div className="flex flex-col gap-2">
        <Label className="font-bold" htmlFor="notes">Notes (optional)</Label>
        <textarea
          id="notes"
          name="notes"
          defaultValue={place.notes ?? ""}
          maxLength={500}
          rows={4}
          className="rounded-md bg-input px-3 py-3 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
      </div>
      {state.error && (
        <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{state.error}</p>
      )}
      <Button type="submit" size="lg" className="mt-2 h-12 text-base" disabled={pending}>
        {pending ? "Saving…" : "Save"}
      </Button>
    </form>
  );
}
