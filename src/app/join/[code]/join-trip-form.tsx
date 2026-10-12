"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { joinTrip, type JoinTripState } from "../actions";

export function JoinTripForm({ code }: { code: string }) {
  const [state, formAction, pending] = useActionState<JoinTripState, FormData>(joinTrip, {});

  return (
    <form action={formAction} className="flex flex-col gap-3">
      <input type="hidden" name="code" value={code} />
      {state.error && (
        <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{state.error}</p>
      )}
      <Button type="submit" size="lg" className="h-12 text-base" disabled={pending}>
        {pending ? "Joining…" : "Join trip"}
      </Button>
    </form>
  );
}
