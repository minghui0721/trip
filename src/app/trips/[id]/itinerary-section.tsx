"use client";

import { useState } from "react";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { formatItineraryDay, formatTime, itineraryDays, plannedDays } from "@/lib/itinerary";
import { cn } from "@/lib/utils";
import { AddPanel } from "./add-panel";
import { ItineraryForm } from "./itinerary/itinerary-form";
import { RemoveItineraryItem } from "./remove-itinerary-item";

export type ItineraryItem = {
  id: string;
  day: string;
  startsAt: string | null;
  title: string;
  notes: string | null;
  placeId: string | null;
  placeName: string | null;
};

export function ItinerarySection({
  tripId,
  startDate,
  endDate,
  items,
  places,
  unavailable,
}: {
  tripId: string;
  startDate: string | null;
  endDate: string | null;
  items: ItineraryItem[];
  places: { id: string; name: string }[];
  unavailable?: "missing" | "failed";
}) {
  const [draftDay, setDraftDay] = useState<string | null>(null);
  const days = itineraryDays(
    plannedDays(startDate, endDate),
    items.map((item) => item.day),
  );

  if (draftDay !== null) {
    return (
      <AddPanel title="Add to the plan" onBack={() => setDraftDay(null)}>
        <ItineraryForm key={draftDay} tripId={tripId} places={places} defaultDay={draftDay} />
      </AddPanel>
    );
  }

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-extrabold tracking-tight">Itinerary</h2>
        {!unavailable && (
          <button
            type="button"
            onClick={() => setDraftDay(startDate ?? "")}
            className={cn(buttonVariants(), "h-10 px-4")}
          >
            Add
          </button>
        )}
      </div>

      {unavailable === "missing" && (
        <p className="text-sm text-muted-foreground">
          The itinerary isn&apos;t in the database yet. Run supabase/migrations/0006_v2_itinerary.sql
          in the Supabase SQL Editor, then reload this page.
        </p>
      )}
      {unavailable === "failed" && (
        <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
          Couldn&apos;t load the itinerary. Check your connection and try again.
        </p>
      )}

      {!unavailable && days.length === 0 && (
        <div className="rounded-2xl bg-card px-6 py-10 text-center">
          <p className="text-lg font-extrabold tracking-tight">Nothing planned yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Add a stop for each day. Link a place when you have one.
          </p>
        </div>
      )}

      {!unavailable && days.length > 0 && (
        <div className="flex flex-col gap-6">
          {days.map((day) => {
            const group = items.filter((item) => item.day === day);
            return (
              <div key={day} className="flex flex-col gap-3">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-sm font-bold tracking-widest text-muted-foreground uppercase">
                    {formatItineraryDay(day, startDate)}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setDraftDay(day)}
                    className="text-sm font-semibold text-primary hover:underline"
                  >
                    Add
                  </button>
                </div>
                {group.length > 0 && (
                  <ul className="flex flex-col gap-3">
                    {group.map((item) => (
                      <li key={item.id} className="flex gap-3 rounded-xl bg-card p-4">
                        <p className="w-12 shrink-0 pt-0.5 text-sm font-bold text-primary tabular-nums">
                          {item.startsAt ? formatTime(item.startsAt) : "–"}
                        </p>
                        <div className="flex min-w-0 flex-1 flex-col gap-2">
                          <div>
                            <p className="font-extrabold tracking-tight">{item.title}</p>
                            {item.placeName && (
                              <p className="text-sm text-muted-foreground">{item.placeName}</p>
                            )}
                            {item.notes && (
                              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{item.notes}</p>
                            )}
                          </div>
                          <div className="flex items-center gap-4">
                            <Link
                              href={`/trips/${tripId}/itinerary/${item.id}/edit`}
                              className="text-sm font-semibold text-primary hover:underline"
                            >
                              Edit
                            </Link>
                            <RemoveItineraryItem tripId={tripId} itemId={item.id} title={item.title} />
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
