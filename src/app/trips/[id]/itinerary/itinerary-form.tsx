"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createItineraryItem, updateItineraryItem, type ItineraryFormState } from "../../itinerary-actions";

type PlaceOption = { id: string; name: string };

export function ItineraryForm({
  tripId,
  places,
  item,
  defaultDay,
  lockDay = false,
}: {
  tripId: string;
  places: PlaceOption[];
  defaultDay: string;
  lockDay?: boolean;
  item?: {
    id: string;
    day: string;
    startsAt: string;
    title: string;
    notes: string;
    placeId: string;
  };
}) {
  const action = item ? updateItineraryItem : createItineraryItem;
  const [state, formAction, pending] = useActionState<ItineraryFormState, FormData>(action, {});
  const day = item?.day || defaultDay;
  const [title, setTitle] = useState(item?.title ?? "");
  const [placeId, setPlaceId] = useState(item?.placeId ?? "");

  function onPlace(nextId: string) {
    const previous = places.find((place) => place.id === placeId);
    const next = places.find((place) => place.id === nextId);
    setPlaceId(nextId);
    if (!title || (previous && title === previous.name)) setTitle(next?.name ?? "");
  }

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <input type="hidden" name="trip_id" value={tripId} />
      {item && <input type="hidden" name="item_id" value={item.id} />}
      <div className={lockDay ? "flex flex-col gap-2" : "grid grid-cols-2 gap-3"}>
        {lockDay ? (
          <input type="hidden" name="day" value={day} />
        ) : (
          <div className="flex flex-col gap-2">
            <Label className="font-bold" htmlFor="day">Date</Label>
            <Input
              id="day"
              name="day"
              type="date"
              required
              defaultValue={day}
              className="h-12 rounded-md bg-input px-3 text-base"
            />
          </div>
        )}
        <div className="flex flex-col gap-2">
          <Label className="font-bold" htmlFor="starts_at">Time (optional)</Label>
          <Input
            id="starts_at"
            name="starts_at"
            type="time"
            defaultValue={item?.startsAt ?? ""}
            className="h-12 rounded-md bg-input px-3 text-base"
          />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Label className="font-bold" htmlFor="title">What you&apos;re doing</Label>
        <Input
          id="title"
          name="title"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="Breakfast at Pho Thin"
          required
          maxLength={100}
          className="h-12 rounded-md bg-input px-3 text-base"
        />
      </div>
      {places.length > 0 && (
        <div className="flex flex-col gap-2">
          <Label className="font-bold" htmlFor="place_id">Place (optional)</Label>
          <select
            id="place_id"
            name="place_id"
            value={placeId}
            onChange={(event) => onPlace(event.target.value)}
            className="h-12 rounded-md bg-input px-3 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
          >
            <option value="">No place</option>
            {places.map((place) => (
              <option key={place.id} value={place.id}>
                {place.name}
              </option>
            ))}
          </select>
          <p className="text-sm text-muted-foreground">Picking a place fills in the name. You can change it.</p>
        </div>
      )}
      {places.length === 0 && <input type="hidden" name="place_id" value="" />}
      <div className="flex flex-col gap-2">
        <Label className="font-bold" htmlFor="notes">Notes (optional)</Label>
        <textarea
          id="notes"
          name="notes"
          defaultValue={item?.notes ?? ""}
          maxLength={500}
          rows={4}
          placeholder="Meet in the lobby."
          className="rounded-md bg-input px-3 py-3 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        />
      </div>
      {state.error && (
        <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{state.error}</p>
      )}
      <Button type="submit" size="lg" className="mt-2 h-12 text-base" disabled={pending}>
        {pending ? "Saving…" : item ? "Save" : "Add to the plan"}
      </Button>
    </form>
  );
}
