"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { deletePlace } from "../place-actions";

export function RemovePlace({
  tripId,
  placeId,
  placeName,
}: {
  tripId: string;
  placeId: string;
  placeName: string;
}) {
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="cursor-pointer text-sm font-medium text-muted-foreground transition-colors hover:text-destructive"
      >
        Remove
      </button>
    );
  }

  return (
    <form action={deletePlace} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="trip_id" value={tripId} />
      <input type="hidden" name="place_id" value={placeId} />
      <p className="mr-auto min-w-0 text-sm break-words text-muted-foreground">Remove {placeName}?</p>
      <Button type="button" variant="outline" size="sm" onClick={() => setConfirming(false)}>
        Cancel
      </Button>
      <Button type="submit" variant="destructive" size="sm">
        Remove
      </Button>
    </form>
  );
}
