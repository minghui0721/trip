"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateTrip, type UpdateTripState } from "../actions";

export function EditTripForm({
  trip,
  onDone,
}: {
  trip: {
    id: string;
    name: string;
    destination: string | null;
    start_date: string | null;
    end_date: string | null;
  };
  onDone: () => void;
}) {
  const router = useRouter();
  const finished = useRef(false);
  const [state, formAction, pending] = useActionState<UpdateTripState, FormData>(updateTrip, {});
  const [name, setName] = useState(trip.name);
  const [destination, setDestination] = useState(trip.destination ?? "");
  const [startDate, setStartDate] = useState(trip.start_date ?? "");
  const [endDate, setEndDate] = useState(trip.end_date ?? "");

  useEffect(() => {
    if (!state.saved || finished.current) return;
    finished.current = true;
    onDone();
    router.refresh();
  }, [state.saved, onDone, router]);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <input type="hidden" name="trip_id" value={trip.id} />
      <h2 className="text-xl font-extrabold tracking-tight">Trip details</h2>
      <div className="flex flex-col gap-2">
        <Label className="font-bold" htmlFor="name">Trip name</Label>
        <Input
          id="name"
          name="name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
          maxLength={100}
          className="h-12 rounded-md bg-input px-3 text-base"
        />
      </div>
      <div className="flex flex-col gap-2">
        <Label className="font-bold" htmlFor="destination">Destination (optional)</Label>
        <Input
          id="destination"
          name="destination"
          value={destination}
          onChange={(event) => setDestination(event.target.value)}
          maxLength={100}
          className="h-12 rounded-md bg-input px-3 text-base"
        />
      </div>
      <div className="flex w-full gap-3">
        <div className="flex w-0 min-w-0 flex-1 flex-col gap-2">
          <Label className="font-bold" htmlFor="start_date">Start date</Label>
          <Input
            id="start_date"
            name="start_date"
            type="date"
            value={startDate}
            onChange={(event) => setStartDate(event.target.value)}
            className="h-12 w-full min-w-0 appearance-none rounded-md bg-input px-3 text-base"
          />
        </div>
        <div className="flex w-0 min-w-0 flex-1 flex-col gap-2">
          <Label className="font-bold" htmlFor="end_date">End date</Label>
          <Input
            id="end_date"
            name="end_date"
            type="date"
            value={endDate}
            onChange={(event) => setEndDate(event.target.value)}
            className="h-12 w-full min-w-0 appearance-none rounded-md bg-input px-3 text-base"
          />
        </div>
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
