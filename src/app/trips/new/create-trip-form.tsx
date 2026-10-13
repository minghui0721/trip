"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createTrip, type CreateTripState } from "../actions";

export function CreateTripForm() {
  const [state, formAction, pending] = useActionState<CreateTripState, FormData>(
    createTrip,
    {},
  );

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <Label className="font-bold" htmlFor="name">Trip name</Label>
        <Input id="name" name="name" placeholder="Vietnam 2026" required maxLength={100} className="h-12 rounded-md bg-input px-3 text-base" />
      </div>
      <div className="flex flex-col gap-2">
        <Label className="font-bold" htmlFor="destination">Destination (optional)</Label>
        <Input id="destination" name="destination" placeholder="Hanoi" maxLength={100} className="h-12 rounded-md bg-input px-3 text-base" />
      </div>
      <div className="flex w-full gap-3">
        <div className="flex w-0 min-w-0 flex-1 flex-col gap-2">
          <Label className="font-bold" htmlFor="start_date">Start date</Label>
          <Input id="start_date" name="start_date" type="date" className="h-12 w-full min-w-0 appearance-none rounded-md bg-input px-3 text-base" />
        </div>
        <div className="flex w-0 min-w-0 flex-1 flex-col gap-2">
          <Label className="font-bold" htmlFor="end_date">End date</Label>
          <Input id="end_date" name="end_date" type="date" className="h-12 w-full min-w-0 appearance-none rounded-md bg-input px-3 text-base" />
        </div>
      </div>
      {state.error && (
        <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{state.error}</p>
      )}
      <Button type="submit" size="lg" className="mt-2 h-12 text-base" disabled={pending}>
        {pending ? "Creating…" : "Create trip"}
      </Button>
    </form>
  );
}
