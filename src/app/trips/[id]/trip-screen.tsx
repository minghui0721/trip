"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { formatDateRange } from "@/lib/format";
import { takeReturnHome } from "@/lib/return-home";
import { tripColor } from "@/lib/trip-color";
import { cn } from "@/lib/utils";
import { EditTripForm } from "./edit-trip-form";
import { PeoplePanel, type TripMember } from "./people-panel";
import { TripTabs, type TripSection } from "./trip-tabs";

export function TripScreen({
  trip,
  members,
  canEdit,
  initial,
  itinerary,
  places,
  expenses,
}: {
  trip: {
    id: string;
    name: string;
    destination: string | null;
    start_date: string | null;
    end_date: string | null;
    invite_code: string;
  };
  members: TripMember[];
  canEdit: boolean;
  initial: TripSection;
  itinerary: React.ReactNode;
  places: React.ReactNode;
  expenses: React.ReactNode;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<TripSection>(initial);
  const [peopleOpen, setPeopleOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const closeEdit = useCallback(() => setEditing(false), []);
  const color = tripColor(trip.id);
  const dates = formatDateRange(trip.start_date, trip.end_date);
  const facts = [trip.destination, dates].filter(Boolean);

  function pathFor(next: TripSection) {
    return next === "itinerary" ? `/trips/${trip.id}` : `/trips/${trip.id}/${next}`;
  }

  function choose(next: TripSection) {
    setPeopleOpen(false);
    setEditing(false);
    setTab(next);
    window.history.replaceState(window.history.state, "", pathFor(next));
  }

  function togglePeople() {
    setEditing(false);
    setPeopleOpen((open) => {
      const next = !open;
      window.history.replaceState(window.history.state, "", next ? `/trips/${trip.id}/people` : pathFor(tab));
      return next;
    });
  }

  function toggleEdit() {
    setPeopleOpen(false);
    setEditing((open) => !open);
    window.history.replaceState(window.history.state, "", pathFor(tab));
  }

  function back() {
    if (takeReturnHome()) {
      router.back();
      return;
    }
    router.push("/");
  }

  return (
    <div className="flex flex-1 flex-col">
      <header
        className="px-5 pt-[max(1rem,env(safe-area-inset-top))] pb-6 md:px-8 md:pt-8"
        style={{ background: `linear-gradient(to bottom, ${color.solid}, ${color.deep} 70%, var(--background))` }}
      >
        <div className="mx-auto w-full max-w-md md:max-w-5xl">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={back}
              aria-label="Back to your trips"
              className="-ml-1 flex size-9 items-center justify-center rounded-full bg-black/30 text-white transition-colors hover:bg-black/50"
            >
              <ChevronLeft className="size-5" />
            </button>
            {canEdit && (
              <button
                type="button"
                onClick={toggleEdit}
                aria-current={editing ? "page" : undefined}
                className={cn(
                  "text-sm font-semibold text-white underline-offset-4 hover:underline",
                  editing && "underline",
                )}
              >
                Edit
              </button>
            )}
          </div>
          <p className="mt-16 text-xs font-bold tracking-widest text-white/70 uppercase md:mt-24">Trip</p>
          <h1 className="mt-1 text-5xl leading-[0.95] font-black tracking-tighter break-words text-white md:text-8xl">
            {trip.name}
          </h1>
          <p className="mt-4 flex flex-wrap items-center gap-x-2 text-sm font-medium text-white/80 md:text-base">
            {facts.map((fact, index) => (
              <span key={`${index}-${fact}`} className="contents">
                {index > 0 && <span aria-hidden="true">·</span>}
                <span>{fact}</span>
              </span>
            ))}
            {facts.length > 0 && <span aria-hidden="true">·</span>}
            <button
              type="button"
              onClick={togglePeople}
              aria-current={peopleOpen ? "page" : undefined}
              className={cn(
                "underline-offset-4 hover:text-white hover:underline",
                peopleOpen && "text-white underline",
              )}
            >
              {members.length} member{members.length === 1 ? "" : "s"}
            </button>
          </p>
        </div>
      </header>
      <TripTabs
        tab={tab}
        onTab={choose}
        itinerary={itinerary}
        places={places}
        expenses={expenses}
        peopleOpen={peopleOpen}
        people={<PeoplePanel tripName={trip.name} inviteCode={trip.invite_code} members={members} />}
        editing={editing}
        editor={editing ? <EditTripForm trip={trip} onDone={closeEdit} /> : null}
      />
    </div>
  );
}
