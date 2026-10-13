"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

export type TripSection = "itinerary" | "places" | "expenses";

const tabs = [
  { id: "itinerary", label: "Itinerary" },
  { id: "places", label: "Places" },
  { id: "expenses", label: "Expenses" },
] as const;

// The three sections are already on the phone. Switching them does not ask the server.
export function TripTabs({
  tripId,
  initial,
  itinerary,
  places,
  expenses,
}: {
  tripId: string;
  initial: TripSection;
  itinerary: React.ReactNode;
  places: React.ReactNode;
  expenses: React.ReactNode;
}) {
  const [tab, setTab] = useState<TripSection>(initial);

  function choose(next: TripSection) {
    setTab(next);
    const path = next === "itinerary" ? `/trips/${tripId}` : `/trips/${tripId}/${next}`;
    window.history.replaceState(null, "", path);
  }

  const panel = tab === "itinerary" ? itinerary : tab === "places" ? places : expenses;

  return (
    <>
      <nav
        aria-label="Trip sections"
        className="sticky top-[env(safe-area-inset-top)] z-20 border-b border-white/10 bg-background/90 px-5 backdrop-blur-md md:px-8"
      >
        <div className="mx-auto flex w-full max-w-md gap-1 py-2 md:max-w-5xl">
          {tabs.map((item) => {
            const current = item.id === tab;
            return (
              <button
                key={item.id}
                type="button"
                aria-current={current ? "page" : undefined}
                onClick={() => choose(item.id)}
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-semibold transition-colors",
                  current
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-white/10 hover:text-foreground",
                )}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </nav>
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-5 py-6 pb-12 md:max-w-5xl md:px-8">
        {panel}
      </main>
    </>
  );
}
