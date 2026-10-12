"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { deleteItineraryItem } from "../itinerary-actions";

export function RemoveItineraryItem({
  tripId,
  itemId,
  title,
}: {
  tripId: string;
  itemId: string;
  title: string;
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
    <form action={deleteItineraryItem} className="flex flex-wrap items-center gap-2">
      <input type="hidden" name="trip_id" value={tripId} />
      <input type="hidden" name="item_id" value={itemId} />
      <p className="mr-auto min-w-0 text-sm break-words text-muted-foreground">Remove {title}?</p>
      <Button type="button" variant="outline" size="sm" onClick={() => setConfirming(false)}>
        Cancel
      </Button>
      <Button type="submit" variant="destructive" size="sm">
        Remove
      </Button>
    </form>
  );
}
